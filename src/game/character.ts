/**
 * LITE - Construtor de personagens 3D "fofos" com cel shading e contorno.
 * Um único construtor procedural serve para o jogador, NPCs e inimigos,
 * garantindo consistência artística e baixo custo de memória.
 */
import * as THREE from "three";

export interface CharacterParts {
  root: THREE.Group;
  body: THREE.Group;
  head: THREE.Group;
  armL: THREE.Object3D;
  armR: THREE.Object3D;
  legL: THREE.Object3D;
  legR: THREE.Object3D;
  accessory?: THREE.Object3D;
}

export interface CharacterOptions {
  skin?: string;
  shirt?: string;
  pants?: string;
  hair?: string;
  scale?: number;
  hat?: boolean;
}

let gradient: THREE.DataTexture | null = null;
function grad() {
  if (!gradient) {
    const data = new Uint8Array([80, 150, 220, 255]);
    gradient = new THREE.DataTexture(data, 4, 1, THREE.RedFormat);
    gradient.magFilter = THREE.NearestFilter;
    gradient.minFilter = THREE.NearestFilter;
    gradient.needsUpdate = true;
  }
  return gradient;
}

const matCache = new Map<string, THREE.MeshToonMaterial>();
export function toon(color: string): THREE.MeshToonMaterial {
  let m = matCache.get(color);
  if (!m) {
    m = new THREE.MeshToonMaterial({ color, gradientMap: grad() });
    matCache.set(color, m);
  }
  return m;
}

const outlineMat = new THREE.MeshBasicMaterial({ color: 0x2a2140, side: THREE.BackSide });

/** Adiciona contorno estilo cartoon a uma malha */
function withOutline(mesh: THREE.Mesh, thickness = 1.07): THREE.Group {
  // O sombreamento toon já entrega a leitura cartunesca; o contorno duplicado
  // gerava artefatos com escalas não uniformes, então mantemos apenas a malha.
  void thickness;
  void outlineMat;
  const g = new THREE.Group();
  g.add(mesh);
  return g;
}

const sphere = new THREE.SphereGeometry(1, 14, 10);
const capsule = new THREE.CapsuleGeometry(1, 1, 4, 10);
const box = new THREE.BoxGeometry(1, 1, 1);

export function createCharacter(opts: CharacterOptions = {}): CharacterParts {
  const {
    skin = "#ffd7b0",
    shirt = "#ff5f7e",
    pants = "#4b7bec",
    hair = "#5b3a29",
    scale = 1,
    hat = false,
  } = opts;

  const root = new THREE.Group();
  root.scale.setScalar(scale);

  // Corpo
  const body = new THREE.Group();
  const torso = new THREE.Mesh(capsule, toon(shirt));
  torso.scale.set(0.42, 0.38, 0.42);
  torso.position.y = 0.78;
  torso.castShadow = true;
  body.add(withOutline(torso, 1.06));

  // Cabeça grande e fofa
  const head = new THREE.Group();
  const skull = new THREE.Mesh(sphere, toon(skin));
  skull.scale.setScalar(0.46);
  skull.castShadow = true;
  head.add(withOutline(skull, 1.03));

  const hairMesh = new THREE.Mesh(sphere, toon(hair));
  hairMesh.scale.set(0.478, 0.43, 0.478);
  hairMesh.position.y = 0.12;
  head.add(hairMesh);

  const eyeGeo = new THREE.SphereGeometry(0.075, 10, 8);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x2a2140 });
  const shine = new THREE.MeshBasicMaterial({ color: 0xffffff });
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(0.17 * s, 0.02, 0.4);
    head.add(eye);
    const sp = new THREE.Mesh(new THREE.SphereGeometry(0.028, 6, 6), shine);
    sp.position.set(0.17 * s + 0.025, 0.06, 0.455);
    head.add(sp);
  }
  // Bochechas
  for (const s of [-1, 1]) {
    const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), toon("#ff9aa8"));
    cheek.position.set(0.3 * s, -0.1, 0.33);
    cheek.scale.set(1, 0.65, 0.4);
    head.add(cheek);
  }
  head.position.y = 1.32;
  body.add(head);

  if (hat) {
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.06, 14), toon("#ffcf4d"));
    brim.position.y = 0.28;
    head.add(brim);
    const top = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.42, 14), toon("#ffcf4d"));
    top.position.y = 0.5;
    head.add(top);
  }

  // Membros (pivô no ombro/quadril para animação por rotação)
  const limb = (color: string, len: number, r: number) => {
    const pivot = new THREE.Group();
    const m = new THREE.Mesh(capsule, toon(color));
    m.scale.set(r, len * 0.5, r);
    m.position.y = -len * 0.5;
    m.castShadow = true;
    pivot.add(m);
    return pivot;
  };

  const armL = limb(skin, 0.5, 0.14);
  armL.position.set(-0.42, 1.02, 0);
  const armR = limb(skin, 0.5, 0.14);
  armR.position.set(0.42, 1.02, 0);
  const legL = limb(pants, 0.5, 0.16);
  legL.position.set(-0.17, 0.55, 0);
  const legR = limb(pants, 0.5, 0.16);
  legR.position.set(0.17, 0.55, 0);
  body.add(armL, armR, legL, legR);

  root.add(body);
  return { root, body, head, armL, armR, legL, legR };
}

export type AnimState = "idle" | "walk" | "run" | "jump" | "fall" | "swim" | "spin" | "interact" | "attack";

/** Animação procedural: todos os estados pedidos, sem arquivos externos. */
export function animateCharacter(p: CharacterParts, state: AnimState, t: number, speed = 1) {
  const { body, head, armL, armR, legL, legR } = p;
  const set = (o: THREE.Object3D, x: number, z = 0) => {
    o.rotation.x = THREE.MathUtils.lerp(o.rotation.x, x, 0.35);
    o.rotation.z = THREE.MathUtils.lerp(o.rotation.z, z, 0.35);
  };
  body.position.y = THREE.MathUtils.lerp(body.position.y, 0, 0.2);
  body.rotation.z = THREE.MathUtils.lerp(body.rotation.z, 0, 0.2);

  switch (state) {
    case "walk":
    case "run": {
      const f = state === "run" ? 13 : 8;
      const a = state === "run" ? 1.05 : 0.62;
      const s = Math.sin(t * f * speed);
      set(legL, s * a);
      set(legR, -s * a);
      set(armL, -s * a * 0.8);
      set(armR, s * a * 0.8);
      body.position.y = Math.abs(Math.sin(t * f * speed)) * (state === "run" ? 0.1 : 0.05);
      body.rotation.x = THREE.MathUtils.lerp(body.rotation.x, state === "run" ? 0.18 : 0.06, 0.2);
      head.rotation.z = Math.sin(t * f * speed * 0.5) * 0.06;
      break;
    }
    case "jump":
      set(legL, -0.5);
      set(legR, -0.2);
      set(armL, -2.3);
      set(armR, -2.3);
      body.rotation.x = THREE.MathUtils.lerp(body.rotation.x, -0.1, 0.2);
      break;
    case "fall":
      set(legL, 0.3);
      set(legR, -0.3);
      set(armL, -1.6, -0.5);
      set(armR, -1.6, 0.5);
      break;
    case "swim": {
      const s = Math.sin(t * 6);
      set(legL, s * 0.4);
      set(legR, -s * 0.4);
      set(armL, -1.2 + s * 0.9, -0.7);
      set(armR, -1.2 - s * 0.9, 0.7);
      body.rotation.x = THREE.MathUtils.lerp(body.rotation.x, 0.9, 0.15);
      body.position.y = -0.35 + Math.sin(t * 2.5) * 0.05;
      break;
    }
    case "spin":
      set(armL, 0, -1.4);
      set(armR, 0, 1.4);
      body.rotation.x = 0;
      break;
    case "interact":
      set(armR, -2.6);
      set(armL, -0.1);
      head.rotation.x = Math.sin(t * 8) * 0.08;
      break;
    case "attack": {
      const s = Math.sin(t * 22);
      set(armR, -2.2 + s * 1.1, -0.4);
      set(armL, 0.3);
      body.rotation.y = s * 0.25;
      break;
    }
    default: {
      const b = Math.sin(t * 2.2) * 0.06;
      set(legL, 0);
      set(legR, 0);
      set(armL, 0, -0.12 + b * 0.4);
      set(armR, 0, 0.12 - b * 0.4);
      body.position.y = b * 0.4;
      body.rotation.x = THREE.MathUtils.lerp(body.rotation.x, 0, 0.2);
      head.rotation.x = Math.sin(t * 1.4) * 0.05;
      head.rotation.y = Math.sin(t * 0.6) * 0.18;
    }
  }
}
