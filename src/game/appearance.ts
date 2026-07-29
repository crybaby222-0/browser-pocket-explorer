/**
 * LITE - Pacotes de textura e shaders de tela.
 * Gera texturas proceduralmente em canvas (nada externo) e aplica
 * em todos os materiais toon do jogo.
 */
import * as THREE from "three";
import { toonMaterials } from "./character";
import type { Aparencia } from "./profile";

const cache = new Map<string, THREE.Texture>();

function gerar(tipo: string): THREE.Texture | null {
  if (tipo === "liso") return null;
  const hit = cache.get(tipo);
  if (hit) return hit;

  const s = 64;
  const cv = document.createElement("canvas");
  cv.width = cv.height = s;
  const ctx = cv.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, s, s);

  if (tipo === "pixel") {
    for (let y = 0; y < s; y += 8)
      for (let x = 0; x < s; x += 8) {
        const v = 220 + Math.floor(Math.random() * 35);
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        ctx.fillRect(x, y, 8, 8);
      }
  } else if (tipo === "aquarela") {
    for (let i = 0; i < 90; i++) {
      const g = ctx.createRadialGradient(
        Math.random() * s,
        Math.random() * s,
        0,
        Math.random() * s,
        Math.random() * s,
        10 + Math.random() * 18,
      );
      g.addColorStop(0, "rgba(255,255,255,0.9)");
      g.addColorStop(1, "rgba(190,190,205,0.25)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, s, s);
    }
  } else if (tipo === "cel") {
    ctx.strokeStyle = "rgba(120,120,140,0.35)";
    ctx.lineWidth = 2;
    for (let i = -s; i < s; i += 10) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + s, s);
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.magFilter = tipo === "pixel" ? THREE.NearestFilter : THREE.LinearFilter;
  cache.set(tipo, tex);
  return tex;
}

/** Aplica pacote de textura + ajustes de shader/render na cena inteira */
export function aplicarAparencia(
  ap: Aparencia,
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer,
  fogPadrao: THREE.Fog | THREE.FogExp2 | null,
) {
  const tex = gerar(ap.textura);
  for (const m of toonMaterials()) {
    if (m.map !== tex) {
      m.map = tex;
      m.needsUpdate = true;
    }
  }
  scene.fog = ap.nevoa ? fogPadrao : null;
  renderer.toneMappingExposure = 0.75 + ap.saturacao * 0.45;
  const dpr = Math.min(window.devicePixelRatio, 2);
  renderer.setPixelRatio(ap.retro ? Math.max(0.35, dpr * 0.35) : dpr);
}
