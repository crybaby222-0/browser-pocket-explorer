/**
 * LITE - Entidades vivas: NPCs com rotina, inimigos, bosses e coletáveis.
 */
import * as THREE from "three";
import { AnimState, animateCharacter, createCharacter, toon, CharacterParts } from "./character";
import { NpcDef } from "./data";
import { modeloDoItem } from "./models";
import { WATER_LEVEL, heightAt } from "./terrain";

/* ------------------------------ NPCs ------------------------------ */

export class Npc {
  def: NpcDef;
  parts: CharacterParts;
  root: THREE.Group;
  private rotaIndex = 0;
  private esperar = 0;
  private anim: AnimState = "idle";
  falando = false;

  constructor(def: NpcDef) {
    this.def = def;
    this.parts = createCharacter({ ...def.cor, scale: 0.95 });
    this.root = this.parts.root;
    const [x, z] = def.home;
    this.root.position.set(x, heightAt(x, z), z);

    // Indicador flutuante de interação
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.28, 0.07, 6, 14),
      new THREE.MeshBasicMaterial({ color: 0xffe066 }),
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 2.35;
    ring.name = "marcador";
    this.root.add(ring);
  }

  update(dt: number, t: number, player: THREE.Vector3) {
    const marker = this.root.getObjectByName("marcador");
    const dist = this.root.position.distanceTo(player);
    if (marker) {
      marker.visible = dist < 12;
      marker.rotation.z = t * 2;
      marker.position.y = 2.35 + Math.sin(t * 3) * 0.08;
    }

    if (this.falando || dist < 3.2) {
      // Olha para o jogador
      const ang = Math.atan2(player.x - this.root.position.x, player.z - this.root.position.z);
      this.root.rotation.y = THREE.MathUtils.lerp(this.root.rotation.y, ang, 0.12);
      this.anim = this.falando ? "interact" : "idle";
      animateCharacter(this.parts, this.anim, t);
      return;
    }

    switch (this.def.rotina) {
      case "caminhar": {
        const [tx, tz] = this.def.rota[this.rotaIndex];
        const dx = tx - this.root.position.x;
        const dz = tz - this.root.position.z;
        const d = Math.hypot(dx, dz);
        if (d < 0.8) {
          this.esperar -= dt;
          if (this.esperar <= 0) {
            this.rotaIndex = (this.rotaIndex + 1) % this.def.rota.length;
            this.esperar = 1.5 + Math.random() * 2;
          }
          this.anim = "idle";
        } else {
          const sp = 1.9;
          this.root.position.x += (dx / d) * sp * dt;
          this.root.position.z += (dz / d) * sp * dt;
          this.root.rotation.y = THREE.MathUtils.lerp(this.root.rotation.y, Math.atan2(dx, dz), 0.15);
          this.anim = "walk";
        }
        break;
      }
      case "trabalhar":
        this.anim = "interact";
        this.root.rotation.y += Math.sin(t * 1.3) * 0.004;
        break;
      case "sentar":
        this.anim = "idle";
        this.parts.legL.rotation.x = -1.4;
        this.parts.legR.rotation.x = -1.4;
        this.root.position.y = heightAt(this.root.position.x, this.root.position.z) - 0.32;
        break;
      case "dormir":
        this.anim = "idle";
        this.root.rotation.z = -Math.PI / 2.1;
        this.root.position.y = heightAt(this.root.position.x, this.root.position.z) + 0.5;
        break;
    }
    if (this.def.rotina !== "dormir" && this.def.rotina !== "sentar") {
      this.root.position.y = heightAt(this.root.position.x, this.root.position.z);
    }
    animateCharacter(this.parts, this.anim, t);
  }
}

/* ---------------------------- Inimigos ---------------------------- */

export type EnemyKind = "slime" | "boss";

export class Enemy {
  kind: EnemyKind;
  root: THREE.Group;
  hp: number;
  maxHp: number;
  dano: number;
  vivo = true;
  private vy = 0;
  private cooldown = 0;
  private hitFlash = 0;
  private mat: THREE.MeshToonMaterial;
  private home: THREE.Vector3;
  private body: THREE.Mesh;

  constructor(kind: EnemyKind, x: number, z: number) {
    this.kind = kind;
    const boss = kind === "boss";
    this.maxHp = boss ? 320 : 46;
    this.hp = this.maxHp;
    this.dano = boss ? 18 : 7;
    this.root = new THREE.Group();
    this.mat = (toon(boss ? "#b04bff" : "#4bd6ff").clone() as THREE.MeshToonMaterial);
    this.mat.transparent = true;
    this.mat.opacity = 0.92;
    this.body = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), this.mat);
    this.body.scale.setScalar(boss ? 2.6 : 0.85);
    this.body.castShadow = true;
    this.root.add(this.body);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x2a2140 });
    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(boss ? 0.22 : 0.09, 8, 6), eyeMat);
      eye.position.set(s * (boss ? 0.75 : 0.28), boss ? 0.5 : 0.18, boss ? 2.3 : 0.78);
      this.root.add(eye);
    }
    if (boss) {
      const crown = new THREE.Mesh(new THREE.ConeGeometry(1.1, 1.2, 6), toon("#ffd166"));
      crown.position.y = 3.2;
      this.root.add(crown);
    }
    this.root.position.set(x, heightAt(x, z) + (boss ? 2.4 : 0.85), z);
    this.home = this.root.position.clone();
  }

  dañar(v: number) {
    this.hp -= v;
    this.hitFlash = 0.18;
    if (this.hp <= 0) {
      this.vivo = false;
      this.root.visible = false;
    }
  }

  /** Retorna true quando acerta o jogador neste frame */
  update(dt: number, t: number, player: THREE.Vector3): boolean {
    if (!this.vivo) return false;
    const boss = this.kind === "boss";
    const r = boss ? 2.6 : 0.85;
    const d = this.root.position.distanceTo(player);
    const alcance = boss ? 26 : 15;
    let bateu = false;

    this.hitFlash = Math.max(0, this.hitFlash - dt);
    this.mat.color.set(this.hitFlash > 0 ? "#ffffff" : boss ? "#b04bff" : "#4bd6ff");

    // Pulinho característico
    const g = heightAt(this.root.position.x, this.root.position.z) + r;
    this.vy -= 22 * dt;
    this.root.position.y += this.vy * dt;
    if (this.root.position.y <= g) {
      this.root.position.y = g;
      this.vy = boss ? 9 : 6.5;
      if (d < alcance) {
        const dx = player.x - this.root.position.x;
        const dz = player.z - this.root.position.z;
        const l = Math.hypot(dx, dz) || 1;
        this.root.position.x += (dx / l) * (boss ? 1.1 : 0.7);
        this.root.position.z += (dz / l) * (boss ? 1.1 : 0.7);
        this.root.rotation.y = Math.atan2(dx, dz);
      } else if (this.root.position.distanceTo(this.home) > 1) {
        const back = this.home.clone().sub(this.root.position).setY(0).normalize();
        this.root.position.addScaledVector(back, 0.4);
      }
    }
    // Squash & stretch
    const squash = THREE.MathUtils.clamp(1 - this.vy * 0.03, 0.72, 1.25);
    this.body.scale.set(r / squash, r * squash, r / squash);

    this.cooldown -= dt;
    if (d < (boss ? 4.2 : 1.7) && this.cooldown <= 0) {
      this.cooldown = boss ? 1.1 : 1.4;
      bateu = true;
    }
    this.root.rotation.z = Math.sin(t * 3) * 0.05;
    return bateu;
  }
}

/* --------------------------- Coletáveis --------------------------- */

export class Pickup {
  id: string;
  qtd: number;
  root: THREE.Group;
  coletado = false;

  constructor(id: string, qtd: number, x: number, z: number, cor: string, y?: number) {
    this.id = id;
    this.qtd = qtd;
    this.root = new THREE.Group();
    const variacao = Math.abs(Math.round(x * 3 + z * 7));
    const modelo = modeloDoItem(id, cor, variacao);
    modelo.position.y = -0.25;
    this.root.add(modelo);
    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(0.62, 10, 8),
      new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: 0.18 }),
    );
    this.root.add(halo);
    const base = y ?? Math.max(heightAt(x, z), WATER_LEVEL);
    this.root.position.set(x, base + 0.9, z);
    this.root.userData.base = base + 0.9;
  }

  update(t: number) {
    if (this.coletado) return;
    this.root.rotation.y = t * 1.4;
    this.root.position.y = (this.root.userData.base as number) + Math.sin(t * 2 + this.root.position.x) * 0.16;
  }
}
