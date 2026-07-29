/**
 * LITE - Modelos 3D procedurais variados para objetos do mundo
 * (flores, potes de mel, cogumelos, cristais, barris, conchas...).
 * Cada modelo é montado com primitivas e materiais toon, sem arquivos externos.
 */
import * as THREE from "three";
import { toon } from "./character";

const CORES_FLOR = ["#ff5f9e", "#ffd166", "#7ad7ff", "#c780ff", "#ff8a5b"];

function flor(variacao: number): THREE.Group {
  const g = new THREE.Group();
  const cor = CORES_FLOR[variacao % CORES_FLOR.length];
  const caule = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.5, 6), toon("#4aa83c"));
  caule.position.y = 0.25;
  g.add(caule);

  const folha = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), toon("#5cc44b"));
  folha.scale.set(1, 0.3, 0.55);
  folha.position.set(0.1, 0.22, 0);
  g.add(folha);

  const petalas = 5 + (variacao % 3);
  for (let i = 0; i < petalas; i++) {
    const a = (i / petalas) * Math.PI * 2;
    const p = new THREE.Mesh(
      variacao % 2 ? new THREE.SphereGeometry(0.13, 8, 6) : new THREE.CircleGeometry(0.14, 7),
      toon(cor),
    );
    if (variacao % 2) p.scale.set(1, 0.35, 0.7);
    p.position.set(Math.cos(a) * 0.15, 0.55, Math.sin(a) * 0.15);
    p.rotation.x = -Math.PI / 2;
    p.rotation.z = a;
    g.add(p);
  }
  const miolo = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), toon("#ffe066"));
  miolo.position.y = 0.58;
  g.add(miolo);
  return g;
}

function potePotDeMel(): THREE.Group {
  const g = new THREE.Group();
  const corpo = new THREE.Mesh(new THREE.LatheGeometry(
    [
      new THREE.Vector2(0.001, 0),
      new THREE.Vector2(0.22, 0),
      new THREE.Vector2(0.3, 0.16),
      new THREE.Vector2(0.24, 0.34),
      new THREE.Vector2(0.26, 0.42),
      new THREE.Vector2(0.001, 0.42),
    ],
    14,
  ), toon("#e9b45a"));
  corpo.castShadow = true;
  g.add(corpo);
  const tampa = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.29, 0.07, 14), toon("#c1462f"));
  tampa.position.y = 0.45;
  g.add(tampa);
  const gota = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), toon("#ffb703"));
  gota.scale.set(1, 1.4, 1);
  gota.position.set(0.24, 0.3, 0.08);
  g.add(gota);
  return g;
}

function cogumelo(cor: string): THREE.Group {
  const g = new THREE.Group();
  const pe = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, 0.3, 8), toon("#fdf1d6"));
  pe.position.y = 0.15;
  g.add(pe);
  const chapeu = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), toon(cor));
  chapeu.position.y = 0.3;
  chapeu.scale.set(1, 0.8, 1);
  g.add(chapeu);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 5), toon("#fff6e0"));
    p.position.set(Math.cos(a) * 0.13, 0.4, Math.sin(a) * 0.13);
    g.add(p);
  }
  return g;
}

function tora(): THREE.Group {
  const g = new THREE.Group();
  const t = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.7, 9), toon("#b5793f"));
  t.rotation.z = Math.PI / 2;
  t.position.y = 0.16;
  t.castShadow = true;
  g.add(t);
  for (const s of [-1, 1]) {
    const anel = new THREE.Mesh(new THREE.CircleGeometry(0.15, 9), toon("#dbb27a"));
    anel.position.set(0.351 * s, 0.16, 0);
    anel.rotation.y = (Math.PI / 2) * s;
    g.add(anel);
  }
  return g;
}

function pedra(): THREE.Group {
  const g = new THREE.Group();
  const p = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28, 0), toon("#a89bbd"));
  p.rotation.set(0.4, 0.8, 0.2);
  p.scale.set(1, 0.75, 1.1);
  p.castShadow = true;
  g.add(p);
  const p2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.15, 0), toon("#8e83a5"));
  p2.position.set(0.24, -0.05, 0.16);
  g.add(p2);
  return g;
}

function cristal(cor: string): THREE.Group {
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const c = new THREE.Mesh(new THREE.ConeGeometry(0.12 - i * 0.02, 0.55 - i * 0.12, 6), toon(cor));
    c.position.set((i - 1) * 0.14, 0.28 - i * 0.05, (i % 2) * 0.1);
    c.rotation.z = (i - 1) * 0.22;
    g.add(c);
  }
  return g;
}

function concha(): THREE.Group {
  const g = new THREE.Group();
  const c = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 8, 0, Math.PI), toon("#ffd6e0"));
  c.rotation.x = -Math.PI / 2;
  c.scale.set(1, 1, 0.55);
  g.add(c);
  for (let i = 0; i < 5; i++) {
    const r = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.03, 0.42), toon("#ffb0c4"));
    r.position.y = 0.06;
    r.rotation.y = (i / 5 - 0.4) * 1.4;
    g.add(r);
  }
  return g;
}

function barril(): THREE.Group {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.26, 0.62, 12), toon("#a9713e"));
  b.position.y = 0.31;
  b.castShadow = true;
  g.add(b);
  for (const y of [0.15, 0.47]) {
    const aro = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.03, 6, 14), toon("#6f4a26"));
    aro.rotation.x = Math.PI / 2;
    aro.position.y = y;
    g.add(aro);
  }
  return g;
}

function maca(): THREE.Group {
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), toon("#ff5f5f"));
  m.scale.set(1, 0.92, 1);
  m.position.y = 0.24;
  g.add(m);
  const cabo = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.14, 5), toon("#7a4a25"));
  cabo.position.y = 0.48;
  g.add(cabo);
  const folha = new THREE.Mesh(new THREE.SphereGeometry(0.09, 7, 6), toon("#5cc44b"));
  folha.scale.set(1, 0.25, 0.5);
  folha.position.set(0.08, 0.5, 0);
  g.add(folha);
  return g;
}

function lanterna(): THREE.Group {
  const g = new THREE.Group();
  const vidro = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.2, 0.34, 8),
    new THREE.MeshBasicMaterial({ color: 0xffe066, transparent: true, opacity: 0.85 }),
  );
  vidro.position.y = 0.3;
  g.add(vidro);
  for (const y of [0.11, 0.49]) {
    const tampa = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.07, 8), toon("#8a6a3f"));
    tampa.position.y = y;
    g.add(tampa);
  }
  const alca = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.02, 5, 10, Math.PI), toon("#8a6a3f"));
  alca.position.y = 0.53;
  g.add(alca);
  return g;
}

function espada(): THREE.Group {
  const g = new THREE.Group();
  const lamina = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.62, 0.03), toon("#d9e6ff"));
  lamina.position.y = 0.55;
  g.add(lamina);
  const guarda = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.06, 0.07), toon("#ffcf4d"));
  guarda.position.y = 0.22;
  g.add(guarda);
  const cabo = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.2, 6), toon("#7a4a25"));
  cabo.position.y = 0.1;
  g.add(cabo);
  return g;
}

/** Modelo 3D de um item/objeto do mundo. `variacao` muda flores e cogumelos. */
export function modeloDoItem(id: string, cor: string, variacao = 0): THREE.Object3D {
  switch (id) {
    case "flor":
      return flor(variacao);
    case "mel":
      return potePotDeMel();
    case "cogumelo":
      return cogumelo(variacao % 2 ? "#ff6b6b" : "#c780ff");
    case "madeira":
      return tora();
    case "pedra":
      return pedra();
    case "cristal":
      return cristal(cor);
    case "concha":
      return concha();
    case "barril":
      return barril();
    case "maca":
      return maca();
    case "lanterna":
      return lanterna();
    case "espada":
      return espada();
    default: {
      const g = new THREE.Group();
      const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3, 0), toon(cor));
      m.position.y = 0.3;
      m.castShadow = true;
      g.add(m);
      return g;
    }
  }
}
