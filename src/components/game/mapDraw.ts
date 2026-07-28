/** Desenho compartilhado do mapa e minimapa em canvas 2D. */
import type { HudState } from "@/game/engine";

const MUNDO = 300;

export function desenharMapa(
  ctx: CanvasRenderingContext2D,
  s: HudState,
  size: number,
  escala: number,
  rotulos: boolean,
) {
  const cx = size / 2;
  const half = escala / 2;
  const proj = (x: number, z: number) => ({
    x: cx + ((x - (escala < MUNDO ? s.jogador.x : 0)) / escala) * size,
    y: cx + ((z - (escala < MUNDO ? s.jogador.z : 0)) / escala) * size,
  });

  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = "#8fd8a8";
  ctx.fillRect(0, 0, size, size);

  // Massas d'água simplificadas (lago, oceano ao sul)
  ctx.fillStyle = "#5fc8ef";
  const lago = proj(-70, 40);
  ctx.beginPath();
  ctx.ellipse(lago.x, lago.y, (42 / escala) * size, (36 / escala) * size, 0, 0, Math.PI * 2);
  ctx.fill();
  const oceano = proj(0, 190);
  ctx.beginPath();
  ctx.ellipse(oceano.x, oceano.y, (260 / escala) * size, (95 / escala) * size, 0, 0, Math.PI * 2);
  ctx.fill();

  // Montanhas
  ctx.fillStyle = "#b9a9d6";
  const mont = proj(60, -95);
  ctx.beginPath();
  ctx.ellipse(mont.x, mont.y, (70 / escala) * size, (55 / escala) * size, 0, 0, Math.PI * 2);
  ctx.fill();

  // Marcos
  for (const m of s.marcos) {
    const p = proj(m.x, m.z);
    ctx.fillStyle = m.kind === "vila" ? "#ff7b6b" : m.kind === "ruinas" ? "#e8e0ff" : "#ffd166";
    ctx.beginPath();
    ctx.arc(p.x, p.y, size * 0.014, 0, Math.PI * 2);
    ctx.fill();
    if (rotulos) {
      ctx.fillStyle = "#2b2140";
      ctx.font = `${Math.round(size * 0.026)}px Nunito, sans-serif`;
      ctx.fillText(m.nome, p.x + size * 0.02, p.y + size * 0.012);
    }
  }

  // Coletáveis
  ctx.fillStyle = "#fff3a8";
  for (const c of s.coletaveis) {
    const p = proj(c.x, c.z);
    ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
  }

  // NPCs
  for (const n of s.npcs) {
    const p = proj(n.x, n.z);
    ctx.fillStyle = "#4bd6ff";
    ctx.beginPath();
    ctx.arc(p.x, p.y, size * 0.011, 0, Math.PI * 2);
    ctx.fill();
  }

  // Inimigos
  for (const e of s.inimigos) {
    const p = proj(e.x, e.z);
    ctx.fillStyle = e.boss ? "#b04bff" : "#ff5470";
    ctx.beginPath();
    ctx.arc(p.x, p.y, size * (e.boss ? 0.018 : 0.011), 0, Math.PI * 2);
    ctx.fill();
  }

  // Destino da missão ativa
  if (s.destino) {
    const p = proj(s.destino[0], s.destino[1]);
    ctx.strokeStyle = "#ffcf4d";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(p.x, p.y, size * 0.03, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(p.x - size * 0.02, p.y);
    ctx.lineTo(p.x + size * 0.02, p.y);
    ctx.moveTo(p.x, p.y - size * 0.02);
    ctx.lineTo(p.x, p.y + size * 0.02);
    ctx.stroke();
  }

  // Jogador (seta orientada)
  const pj = proj(s.jogador.x, s.jogador.z);
  ctx.save();
  ctx.translate(pj.x, pj.y);
  ctx.rotate(-s.jogador.ang + Math.PI);
  ctx.fillStyle = "#2b2140";
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.026);
  ctx.lineTo(size * 0.018, size * 0.02);
  ctx.lineTo(-size * 0.018, size * 0.02);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.008, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  void half;
}
