/**
 * LITE - Terreno procedural
 * Gera a altura do mundo contínuo (sem telas de carregamento) a partir de
 * ruído de valor determinístico. Todos os sistemas (física, IA, spawn de
 * vegetação) consultam `heightAt` para se manter coerentes.
 */
import * as THREE from "three";

export const WORLD_SIZE = 320; // mundo quadrado de 320x320 unidades
export const WATER_LEVEL = 1.2;

/** Configuração do mundo atual (semente e relevo), definida pelo menu de mundos */
export interface WorldConfig {
  seed: number;
  montanhas: number;
  floresta: number;
  agua: number;
}
export const WORLD_CFG: WorldConfig = { seed: 1337, montanhas: 1, floresta: 1, agua: 0 };
export function setWorldConfig(c: Partial<WorldConfig>) {
  Object.assign(WORLD_CFG, c);
}

/** Hash determinístico 2D -> [0,1) */
function hash(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7 + WORLD_CFG.seed * 0.013) * 43758.5453123;
  return n - Math.floor(n);
}

function smooth(t: number) {
  return t * t * (3 - 2 * t);
}

/** Ruído de valor com interpolação suave */
function valueNoise(x: number, y: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = smooth(xf);
  const v = smooth(yf);
  const a = hash(xi, yi);
  const b = hash(xi + 1, yi);
  const c = hash(xi, yi + 1);
  const d = hash(xi + 1, yi + 1);
  return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
}

function fbm(x: number, y: number, octaves = 4): number {
  let amp = 1;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += valueNoise(x * freq, y * freq) * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / norm;
}

export type Biome = "praia" | "lago" | "montanha" | "floresta" | "campo" | "vila" | "ruinas";

/** Pontos de interesse do mundo (usados por biomas, mapa e missões) */
export const POI = {
  vila: new THREE.Vector2(0, -20),
  lago: new THREE.Vector2(-70, 40),
  montanha: new THREE.Vector2(60, -95),
  caverna: new THREE.Vector2(52, -78),
  ruinas: new THREE.Vector2(-80, -80),
  praia: new THREE.Vector2(0, 120),
  ilha: new THREE.Vector2(40, 140),
  campo: new THREE.Vector2(-40, -10),
};

function falloff(d: number, r: number) {
  return THREE.MathUtils.clamp(1 - d / r, 0, 1);
}

/** Altura do terreno em qualquer coordenada do mundo. */
export function heightAt(x: number, z: number): number {
  // Colinas base
  let h = fbm(x * 0.012 + 10, z * 0.012 - 4, 4) * 9 - 1.5;
  h += fbm(x * 0.05, z * 0.05, 3) * 1.6;

  // Cadeia de montanhas ao norte
  const dm = Math.hypot(x - POI.montanha.x, z - POI.montanha.y);
  h += Math.pow(falloff(dm, 85), 2.1) * 46;
  const dm2 = Math.hypot(x + 30, z + 110);
  h += Math.pow(falloff(dm2, 60), 2.2) * 30;

  // Bacia do lago
  const dl = Math.hypot(x - POI.lago.x, z - POI.lago.y);
  h -= Math.pow(falloff(dl, 42), 1.4) * 12;

  // Planalto da vila (terreno plano para as casas)
  const dv = Math.hypot(x - POI.vila.x, z - POI.vila.y);
  const vw = falloff(dv, 34);
  h = THREE.MathUtils.lerp(h, 4.2 + fbm(x * 0.03, z * 0.03, 2) * 0.5, Math.pow(vw, 1.3));

  // Praia ao sul: desce suavemente até o oceano
  const beach = THREE.MathUtils.smoothstep(z, 78, 135);
  h = THREE.MathUtils.lerp(h, -6 + fbm(x * 0.02, z * 0.02, 2) * 1.2, beach);

  // Pequenas ilhas no oceano
  for (const c of [POI.ilha, new THREE.Vector2(-45, 152), new THREE.Vector2(95, 118)]) {
    const di = Math.hypot(x - c.x, z - c.y);
    h += Math.pow(falloff(di, 16), 1.5) * 12;
  }

  // Planalto das ruínas
  const dr = Math.hypot(x - POI.ruinas.x, z - POI.ruinas.y);
  h = THREE.MathUtils.lerp(h, 11 + fbm(x * 0.04, z * 0.04, 2), Math.pow(falloff(dr, 22), 1.5));

  // Trilha reta ligando vila -> lago (levemente rebaixada e plana)
  h = flattenPath(h, x, z, POI.vila, POI.lago, 4.5);
  h = flattenPath(h, x, z, POI.vila, POI.montanha, 4.5);
  h = flattenPath(h, x, z, POI.vila, new THREE.Vector2(6, 82), 5);

  // Borda do mundo mergulha no oceano
  const edge = Math.max(Math.abs(x), Math.abs(z));
  h = THREE.MathUtils.lerp(h, -10, THREE.MathUtils.smoothstep(edge, WORLD_SIZE / 2 - 40, WORLD_SIZE / 2));

  return h;
}

function flattenPath(h: number, x: number, z: number, a: THREE.Vector2, b: THREE.Vector2, w: number) {
  const ax = b.x - a.x;
  const az = b.y - a.y;
  const t = THREE.MathUtils.clamp(((x - a.x) * ax + (z - a.y) * az) / (ax * ax + az * az), 0, 1);
  const px = a.x + ax * t;
  const pz = a.y + az * t;
  const d = Math.hypot(x - px, z - pz);
  if (d > w) return h;
  const ha = heightRaw(a.x, a.y);
  const hb = heightRaw(b.x, b.y);
  const target = THREE.MathUtils.lerp(ha, hb, t) - 0.15;
  return THREE.MathUtils.lerp(h, target, falloff(d, w) * 0.55);
}

/** Altura sem trilhas (evita recursão) */
function heightRaw(x: number, z: number): number {
  let h = fbm(x * 0.012 + 10, z * 0.012 - 4, 4) * 9 - 1.5;
  const dm = Math.hypot(x - POI.montanha.x, z - POI.montanha.y);
  h += Math.pow(falloff(dm, 85), 2.1) * 46;
  const dl = Math.hypot(x - POI.lago.x, z - POI.lago.y);
  h -= Math.pow(falloff(dl, 42), 1.4) * 12;
  const dv = Math.hypot(x - POI.vila.x, z - POI.vila.y);
  h = THREE.MathUtils.lerp(h, 4.2, Math.pow(falloff(dv, 34), 1.3));
  const beach = THREE.MathUtils.smoothstep(z, 78, 135);
  return THREE.MathUtils.lerp(h, -6, beach);
}

/** Normal aproximada do terreno (usada para rampas e alinhamento) */
export function normalAt(x: number, z: number, e = 0.8): THREE.Vector3 {
  const hl = heightAt(x - e, z);
  const hr = heightAt(x + e, z);
  const hd = heightAt(x, z - e);
  const hu = heightAt(x, z + e);
  return new THREE.Vector3(hl - hr, 2 * e, hd - hu).normalize();
}

export function biomeAt(x: number, z: number): Biome {
  const h = heightAt(x, z);
  if (z > 90 && h < 3) return "praia";
  if (h < WATER_LEVEL) return "lago";
  if (h > 20) return "montanha";
  if (Math.hypot(x - POI.vila.x, z - POI.vila.y) < 30) return "vila";
  if (Math.hypot(x - POI.ruinas.x, z - POI.ruinas.y) < 22) return "ruinas";
  const f = fbm(x * 0.02 + 99, z * 0.02 + 33, 2);
  return f > 0.52 ? "floresta" : "campo";
}

/** Paleta vibrante estilo portátil */
export const PALETTE = {
  grass: new THREE.Color("#7ad14a"),
  grassDark: new THREE.Color("#4aa83c"),
  sand: new THREE.Color("#f7e2a3"),
  rock: new THREE.Color("#9b8fb0"),
  snow: new THREE.Color("#fbf7ff"),
  dirt: new THREE.Color("#c58f52"),
  meadow: new THREE.Color("#a8e05f"),
};

/** Gera a malha do terreno com cores por vértice (baixa resolução proposital) */
export function buildTerrain(segments = 200): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE, segments, segments);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const y = heightAt(x, z);
    pos.setY(i, y);

    const slope = 1 - normalAt(x, z, 1.2).y;
    if (y < WATER_LEVEL + 0.9) c.copy(PALETTE.sand);
    else if (y > 30) c.copy(PALETTE.snow);
    else if (y > 19 || slope > 0.42) c.copy(PALETTE.rock);
    else {
      const t = THREE.MathUtils.clamp((y - 2) / 16, 0, 1);
      c.copy(PALETTE.meadow).lerp(PALETTE.grassDark, t);
      if (fbm(x * 0.09, z * 0.09, 2) > 0.6) c.lerp(PALETTE.grass, 0.6);
    }
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const mat = new THREE.MeshToonMaterial({ vertexColors: true });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  mesh.name = "terreno";
  return mesh;
}

/** Rampa de gradiente de 3 tons para o efeito cel shading */
export function toonGradient(): THREE.DataTexture {
  const data = new Uint8Array([90, 160, 225, 255]);
  const tex = new THREE.DataTexture(data, data.length, 1, THREE.RedFormat);
  tex.needsUpdate = true;
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  return tex;
}
