/**
 * LITE - Construção do mundo aberto contínuo.
 * Vegetação, vila, ruínas, cavernas, pontes, água animada, céu e partículas.
 * Usa InstancedMesh + LOD por distância para manter FPS alto no mobile.
 */
import * as THREE from "three";
import { PALETTE, POI, WATER_LEVEL, WORLD_SIZE, biomeAt, heightAt, normalAt } from "./terrain";
import { toon } from "./character";

export interface Collider {
  x: number;
  z: number;
  r: number;
  h?: number;
}

export interface WorldRefs {
  group: THREE.Group;
  water: THREE.Mesh;
  colliders: Collider[];
  grassMats: THREE.Material[];
  update: (t: number, playerPos: THREE.Vector3, renderDistance: number) => void;
  landmarks: { name: string; pos: THREE.Vector2; kind: string }[];
}

/** RNG determinístico para que o mundo seja sempre o mesmo */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/** Shader de balanço aplicado a grama, folhas e flores */
function windify(mat: THREE.Material, amount: number, store: THREE.Material[]) {
  (mat as THREE.MeshToonMaterial).onBeforeCompile = (shader) => {
    shader.uniforms.uTime = { value: 0 };
    (mat as unknown as { uniforms?: Record<string, { value: number }> }).uniforms = shader.uniforms;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\nuniform float uTime;`)
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
         #ifdef USE_INSTANCING
           vec3 wp = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
         #else
           vec3 wp = vec3(0.0);
         #endif
         float sway = sin(uTime * 1.7 + wp.x * 0.4 + wp.z * 0.35) * ${amount.toFixed(3)};
         transformed.x += sway * max(position.y, 0.0);
         transformed.z += sway * 0.6 * max(position.y, 0.0);`,
      );
  };
  store.push(mat);
}

function place(count: number, seed: number, filter: (x: number, z: number, h: number) => boolean, radius = WORLD_SIZE / 2 - 12) {
  const r = rng(seed);
  const out: THREE.Vector3[] = [];
  let guard = 0;
  while (out.length < count && guard++ < count * 40) {
    const x = (r() * 2 - 1) * radius;
    const z = (r() * 2 - 1) * radius;
    const h = heightAt(x, z);
    if (filter(x, z, h)) out.push(new THREE.Vector3(x, h, z));
  }
  return out;
}

/* ---------- Geometrias reutilizadas ---------- */
const trunkGeo = new THREE.CylinderGeometry(0.22, 0.34, 2.4, 6);
const leafGeo = new THREE.SphereGeometry(1, 8, 6);
const pineGeo = new THREE.ConeGeometry(1.1, 2.4, 7);
const rockGeo = new THREE.DodecahedronGeometry(1, 0);
const bladeGeo = new THREE.ConeGeometry(0.12, 0.85, 3);
const petalGeo = new THREE.SphereGeometry(0.16, 6, 5);

export function buildWorld(scene: THREE.Scene): WorldRefs {
  const group = new THREE.Group();
  const colliders: Collider[] = [];
  const grassMats: THREE.Material[] = [];
  const landmarks: WorldRefs["landmarks"] = [];
  const lodTargets: { mesh: THREE.Object3D; dist: number }[] = [];

  /* ---------- Árvores frondosas (floresta / campo) ---------- */
  const treeSpots = place(320, 7, (x, z, h) => {
    const b = biomeAt(x, z);
    return h > WATER_LEVEL + 1.2 && h < 19 && (b === "floresta" || (b === "campo" && Math.random() > 0.65));
  });
  const trunks = new THREE.InstancedMesh(trunkGeo, toon("#a9663f"), treeSpots.length);
  const leafMat = toon("#3fc46a").clone();
  windify(leafMat, 0.05, grassMats);
  const leaves = new THREE.InstancedMesh(leafGeo, leafMat, treeSpots.length * 2);
  const dummy = new THREE.Object3D();
  const colorA = new THREE.Color("#4fdc7a");
  const colorB = new THREE.Color("#2fa85a");
  let li = 0;
  treeSpots.forEach((p, i) => {
    const s = 0.8 + Math.random() * 0.7;
    dummy.position.set(p.x, p.y + 1.2 * s, p.z);
    dummy.scale.setScalar(s);
    dummy.rotation.y = Math.random() * Math.PI;
    dummy.updateMatrix();
    trunks.setMatrixAt(i, dummy.matrix);
    for (let k = 0; k < 2; k++) {
      dummy.position.set(p.x + (k ? 0.5 : 0) * s, p.y + (2.4 + k * 0.8) * s, p.z + (k ? -0.3 : 0) * s);
      dummy.scale.setScalar((k ? 1.0 : 1.45) * s);
      dummy.updateMatrix();
      leaves.setMatrixAt(li, dummy.matrix);
      leaves.setColorAt(li, colorA.clone().lerp(colorB, Math.random()));
      li++;
    }
    colliders.push({ x: p.x, z: p.z, r: 0.55 * s });
  });
  trunks.castShadow = true;
  leaves.castShadow = true;
  group.add(trunks, leaves);

  /* ---------- Pinheiros nas montanhas ---------- */
  const pineSpots = place(180, 21, (_x, _z, h) => h > 14 && h < 30);
  const pineMat = toon("#2f9d64").clone();
  windify(pineMat, 0.02, grassMats);
  const pines = new THREE.InstancedMesh(pineGeo, pineMat, pineSpots.length * 2);
  const pineTrunks = new THREE.InstancedMesh(trunkGeo, toon("#8a5433"), pineSpots.length);
  pineSpots.forEach((p, i) => {
    const s = 0.9 + Math.random() * 0.8;
    dummy.position.set(p.x, p.y + 1 * s, p.z);
    dummy.scale.setScalar(s * 0.8);
    dummy.updateMatrix();
    pineTrunks.setMatrixAt(i, dummy.matrix);
    for (let k = 0; k < 2; k++) {
      dummy.position.set(p.x, p.y + (2.2 + k * 1.3) * s, p.z);
      dummy.scale.setScalar(s * (1 - k * 0.32));
      dummy.updateMatrix();
      pines.setMatrixAt(i * 2 + k, dummy.matrix);
    }
    colliders.push({ x: p.x, z: p.z, r: 0.5 * s });
  });
  pines.castShadow = true;
  group.add(pines, pineTrunks);

  /* ---------- Grama balançando (LOD: some ao longe) ---------- */
  const grassSpots = place(2600, 44, (x, z, h) => h > WATER_LEVEL + 0.6 && h < 17 && biomeAt(x, z) !== "vila");
  const bladeMat = toon("#74d94f").clone();
  windify(bladeMat, 0.22, grassMats);
  const blades = new THREE.InstancedMesh(bladeGeo, bladeMat, grassSpots.length);
  grassSpots.forEach((p, i) => {
    dummy.position.set(p.x, p.y + 0.35, p.z);
    dummy.rotation.set(0, Math.random() * 3, 0);
    dummy.scale.set(1, 0.7 + Math.random() * 0.9, 1);
    dummy.updateMatrix();
    blades.setMatrixAt(i, dummy.matrix);
  });
  group.add(blades);
  lodTargets.push({ mesh: blades, dist: 70 });

  /* ---------- Campos floridos ---------- */
  const flowerColors = ["#ff5f9e", "#ffd93d", "#7ad7ff", "#ff8b3d", "#c77dff"];
  const flowerSpots = place(900, 91, (x, z, h) => h > WATER_LEVEL + 0.8 && h < 13 && Math.hypot(x - POI.campo.x, z - POI.campo.y) < 95);
  const petalMat = toon("#ffffff").clone();
  windify(petalMat, 0.16, grassMats);
  const flowers = new THREE.InstancedMesh(petalGeo, petalMat, flowerSpots.length);
  const fc = new THREE.Color();
  flowerSpots.forEach((p, i) => {
    dummy.position.set(p.x, p.y + 0.35, p.z);
    dummy.scale.setScalar(0.8 + Math.random() * 0.6);
    dummy.updateMatrix();
    flowers.setMatrixAt(i, dummy.matrix);
    flowers.setColorAt(i, fc.set(flowerColors[i % flowerColors.length]));
  });
  group.add(flowers);
  lodTargets.push({ mesh: flowers, dist: 90 });

  /* ---------- Pedras ---------- */
  const rockSpots = place(220, 133, (_x, _z, h) => h > WATER_LEVEL);
  const rocks = new THREE.InstancedMesh(rockGeo, toon("#a89bbd"), rockSpots.length);
  rockSpots.forEach((p, i) => {
    const s = 0.5 + Math.random() * 1.6;
    dummy.position.set(p.x, p.y + s * 0.4, p.z);
    dummy.scale.set(s, s * 0.7, s);
    dummy.rotation.set(Math.random(), Math.random() * 3, Math.random());
    dummy.updateMatrix();
    rocks.setMatrixAt(i, dummy.matrix);
    if (s > 1) colliders.push({ x: p.x, z: p.z, r: s * 0.8 });
  });
  rocks.castShadow = true;
  rocks.receiveShadow = true;
  group.add(rocks);

  /* ---------- Vila cartunesca ---------- */
  const village = new THREE.Group();
  const houseColors = ["#ff7b6b", "#ffd166", "#8ecae6", "#b1e08a", "#ffa8d5"];
  const roofColors = ["#e64c58", "#c9427a", "#3d7fbf", "#4aa85e", "#f2802e"];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + 0.4;
    const rad = 13 + (i % 3) * 6;
    const x = POI.vila.x + Math.cos(a) * rad;
    const z = POI.vila.y + Math.sin(a) * rad;
    const y = heightAt(x, z);
    const h = new THREE.Group();
    const w = 3.4 + (i % 2) * 0.8;
    const walls = new THREE.Mesh(new THREE.BoxGeometry(w, 3, w * 0.9), toon(houseColors[i % 5]));
    walls.position.y = 1.5;
    walls.castShadow = true;
    walls.receiveShadow = true;
    h.add(walls);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(w * 0.92, 2.1, 4), toon(roofColors[i % 5]));
    roof.position.y = 4.05;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    h.add(roof);
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.5, 0.12), toon("#7a4a2b"));
    door.position.set(0, 0.75, w * 0.45 + 0.05);
    h.add(door);
    for (const s of [-1, 1]) {
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.12), toon("#ffe9a8"));
      win.position.set(s * 1.1, 2, w * 0.45 + 0.05);
      h.add(win);
    }
    h.position.set(x, y, z);
    h.rotation.y = -a + Math.PI / 2;
    village.add(h);
    colliders.push({ x, z, r: w * 0.72 });
  }
  // Poço central da vila
  const well = new THREE.Group();
  const wellBase = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.3, 1, 12), toon("#b0a4c4"));
  wellBase.position.y = 0.5;
  well.add(wellBase);
  const wellRoof = new THREE.Mesh(new THREE.ConeGeometry(1.6, 1, 6), toon("#e05c4a"));
  wellRoof.position.y = 2.6;
  well.add(wellRoof);
  for (const s of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2, 0.16), toon("#8a5a37"));
    post.position.set(s * 0.9, 1.5, 0);
    well.add(post);
  }
  well.position.set(POI.vila.x, heightAt(POI.vila.x, POI.vila.y), POI.vila.y);
  village.add(well);
  colliders.push({ x: POI.vila.x, z: POI.vila.y, r: 1.5 });
  group.add(village);
  landmarks.push({ name: "Vila Pétala", pos: POI.vila.clone(), kind: "vila" });

  /* ---------- Ruínas antigas ---------- */
  const ruins = new THREE.Group();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const x = POI.ruinas.x + Math.cos(a) * 9;
    const z = POI.ruinas.y + Math.sin(a) * 9;
    const hgt = 2 + ((i * 7) % 5);
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.7, hgt, 8), toon("#d9d2e8"));
    col.position.set(x, heightAt(x, z) + hgt / 2, z);
    col.castShadow = true;
    ruins.add(col);
    colliders.push({ x, z, r: 0.8 });
  }
  const altar = new THREE.Mesh(new THREE.BoxGeometry(3, 0.8, 3), toon("#c0b7d6"));
  altar.position.set(POI.ruinas.x, heightAt(POI.ruinas.x, POI.ruinas.y) + 0.4, POI.ruinas.y);
  ruins.add(altar);
  group.add(ruins);
  landmarks.push({ name: "Ruínas de Aur", pos: POI.ruinas.clone(), kind: "ruinas" });

  /* ---------- Entrada da caverna ---------- */
  const caveY = heightAt(POI.caverna.x, POI.caverna.y);
  const caveMouth = new THREE.Mesh(new THREE.SphereGeometry(3.2, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), toon("#3c2f57"));
  caveMouth.position.set(POI.caverna.x, caveY, POI.caverna.y);
  caveMouth.scale.set(1, 1.2, 0.7);
  group.add(caveMouth);
  const caveInner = new THREE.Mesh(new THREE.SphereGeometry(2.5, 12, 8), new THREE.MeshBasicMaterial({ color: 0x1b1330 }));
  caveInner.position.set(POI.caverna.x, caveY + 0.8, POI.caverna.y - 1.4);
  group.add(caveInner);
  landmarks.push({ name: "Caverna Cintilante", pos: POI.caverna.clone(), kind: "caverna" });
  landmarks.push({ name: "Monte Aurora", pos: POI.montanha.clone(), kind: "montanha" });
  landmarks.push({ name: "Lago Espelho", pos: POI.lago.clone(), kind: "lago" });
  landmarks.push({ name: "Praia Coral", pos: POI.praia.clone(), kind: "praia" });

  /* ---------- Pontes de madeira ---------- */
  const bridge = (from: THREE.Vector2, to: THREE.Vector2) => {
    const g = new THREE.Group();
    const dir = to.clone().sub(from);
    const len = dir.length();
    const planks = Math.floor(len / 1.1);
    for (let i = 0; i <= planks; i++) {
      const t = i / planks;
      const x = from.x + dir.x * t;
      const z = from.y + dir.y * t;
      const y = Math.max(heightAt(x, z), WATER_LEVEL) + 0.35;
      const plank = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.16, 1), toon("#b5793f"));
      plank.position.set(x, y, z);
      plank.rotation.y = Math.atan2(dir.x, dir.y);
      plank.receiveShadow = true;
      g.add(plank);
      if (i % 3 === 0) {
        for (const s of [-1, 1]) {
          const rail = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.9, 0.14), toon("#8a5a37"));
          rail.position.set(x + Math.cos(Math.atan2(dir.y, dir.x)) * 0 + s * 1.2 * Math.cos(Math.atan2(dir.x, dir.y)), y + 0.5, z - s * 1.2 * Math.sin(Math.atan2(dir.x, dir.y)));
          g.add(rail);
        }
      }
    }
    return g;
  };
  group.add(bridge(new THREE.Vector2(-46, 30), new THREE.Vector2(-62, 46)));
  group.add(bridge(new THREE.Vector2(10, 96), new THREE.Vector2(34, 132)));

  /* ---------- Água animada (lago + oceano) ---------- */
  const waterGeo = new THREE.PlaneGeometry(WORLD_SIZE * 1.6, WORLD_SIZE * 1.6, 90, 90);
  waterGeo.rotateX(-Math.PI / 2);
  const waterMat = new THREE.MeshToonMaterial({
    color: new THREE.Color("#3fc8ee"),
    transparent: true,
    opacity: 0.82,
  });
  waterMat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = { value: 0 };
    (waterMat as unknown as { uniforms?: Record<string, { value: number }> }).uniforms = shader.uniforms;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nuniform float uTime;")
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
         transformed.y += sin(position.x * 0.22 + uTime * 1.6) * 0.22
                        + cos(position.z * 0.19 + uTime * 1.1) * 0.18;`,
      );
  };
  grassMats.push(waterMat);
  const water = new THREE.Mesh(waterGeo, waterMat);
  water.position.y = WATER_LEVEL;
  water.renderOrder = 1;
  group.add(water);

  /* ---------- Nuvens fofas ---------- */
  const cloudMat = new THREE.MeshToonMaterial({ color: 0xffffff });
  for (let i = 0; i < 26; i++) {
    const c = new THREE.Group();
    for (let k = 0; k < 4; k++) {
      const puff = new THREE.Mesh(leafGeo, cloudMat);
      puff.position.set((Math.random() - 0.5) * 9, Math.random() * 1.4, (Math.random() - 0.5) * 5);
      puff.scale.setScalar(2 + Math.random() * 2.6);
      c.add(puff);
    }
    c.position.set((Math.random() - 0.5) * WORLD_SIZE, 46 + Math.random() * 22, (Math.random() - 0.5) * WORLD_SIZE);
    c.userData.speed = 0.5 + Math.random();
    group.add(c);
    lodTargets.push({ mesh: c, dist: 9999 });
  }
  const clouds = group.children.filter((c) => c.userData.speed);

  /* ---------- Partículas: poeira, folhas e brilho ---------- */
  const pCount = 260;
  const pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(pCount * 3);
  const pCol = new Float32Array(pCount * 3);
  const pSeed = new Float32Array(pCount);
  const tmpC = new THREE.Color();
  for (let i = 0; i < pCount; i++) {
    pPos[i * 3] = (Math.random() - 0.5) * 60;
    pPos[i * 3 + 1] = Math.random() * 8;
    pPos[i * 3 + 2] = (Math.random() - 0.5) * 60;
    tmpC.set(i % 3 === 0 ? "#fff6a8" : i % 3 === 1 ? "#ffd3e0" : "#c8ffb0");
    pCol.set([tmpC.r, tmpC.g, tmpC.b], i * 3);
    pSeed[i] = Math.random() * 100;
  }
  pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute("color", new THREE.BufferAttribute(pCol, 3));
  const particles = new THREE.Points(
    pGeo,
    new THREE.PointsMaterial({ size: 0.28, vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false }),
  );
  group.add(particles);

  scene.add(group);

  const tmpV = new THREE.Vector3();
  const update = (t: number, playerPos: THREE.Vector3, renderDistance: number) => {
    for (const m of grassMats) {
      const u = (m as unknown as { uniforms?: Record<string, { value: number }> }).uniforms;
      if (u?.uTime) u.uTime.value = t;
    }
    water.position.x = playerPos.x;
    water.position.z = playerPos.z;

    for (const c of clouds) {
      c.position.x += (c.userData.speed as number) * 0.02;
      if (c.position.x > WORLD_SIZE / 2) c.position.x = -WORLD_SIZE / 2;
    }

    // LOD simples: desliga detalhes distantes conforme a distância de renderização
    for (const l of lodTargets) l.mesh.visible = l.dist <= renderDistance;

    // Partículas seguem o jogador (object pooling implícito)
    const arr = pGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pCount; i++) {
      let y = arr.getY(i) + 0.012 + Math.sin(t + pSeed[i]) * 0.004;
      let x = arr.getX(i) + Math.sin(t * 0.6 + pSeed[i]) * 0.02;
      let z = arr.getZ(i) + Math.cos(t * 0.5 + pSeed[i]) * 0.02;
      if (y > playerPos.y + 12) y = playerPos.y - 1;
      tmpV.set(x - playerPos.x, 0, z - playerPos.z);
      if (tmpV.length() > 34) {
        x = playerPos.x + (Math.random() - 0.5) * 50;
        z = playerPos.z + (Math.random() - 0.5) * 50;
      }
      arr.setXYZ(i, x, y, z);
    }
    arr.needsUpdate = true;
  };

  return { group, water, colliders, grassMats, update, landmarks };
}

/** Céu com gradiente suave (domo invertido) */
export function buildSky(scene: THREE.Scene): THREE.Mesh {
  const geo = new THREE.SphereGeometry(140, 24, 16);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      top: { value: new THREE.Color("#4fc3ff") },
      mid: { value: new THREE.Color("#a8e6ff") },
      bottom: { value: new THREE.Color("#ffe6b8") },
    },
    vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `
      varying vec3 vP; uniform vec3 top; uniform vec3 mid; uniform vec3 bottom;
      void main(){
        float h = normalize(vP).y * 0.5 + 0.5;
        vec3 c = mix(bottom, mid, smoothstep(0.35, 0.55, h));
        c = mix(c, top, smoothstep(0.55, 0.95, h));
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  const sky = new THREE.Mesh(geo, mat);
  sky.frustumCulled = false;
  sky.renderOrder = -10;
  scene.add(sky);
  return sky;
}

export { WATER_LEVEL, heightAt, normalAt, PALETTE };
