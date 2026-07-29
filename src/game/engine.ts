/**
 * LITE - Motor do jogo: cena, câmera em terceira pessoa, física, combate,
 * missões, inventário, save automático e ponte reativa com a interface.
 */
import * as THREE from "three";
import { AnimState, CharacterParts, animateCharacter, createCharacter, toon } from "./character";
import { InputManager, Bindings, DEFAULT_BINDINGS } from "./input";
import { AudioEngine } from "./audio";
import { WATER_LEVEL, buildTerrain, biomeAt, heightAt, normalAt, POI } from "./terrain";
import { buildSky, buildWorld, Collider, WorldRefs } from "./world";
import { Enemy, Npc, Pickup } from "./entities";
import { ITENS, NPCS, QUESTS, RECEITAS, DialogoNo, NpcDef } from "./data";
import { DEFAULT_SETTINGS, SaveData, Settings, loadGame, saveGame } from "./save";
import { APARENCIA_PADRAO, AVATAR_PADRAO, Aparencia, AvatarConfig } from "./profile";
import { aplicarAparencia as aplicarAparenciaCena } from "./appearance";

export interface GameOptions {
  avatar?: AvatarConfig;
  aparencia?: Aparencia;
}

export interface RemotoInfo {
  id: string;
  nome: string;
  x: number;
  y: number;
  z: number;
  ang: number;
  anim?: string;
  avatar?: AvatarConfig;
}

interface Remoto {
  partes: CharacterParts;
  alvo: THREE.Vector3;
  nome: string;
  anim: AnimState;
}


export interface Slot {
  id: string;
  qtd: number;
}

export interface DialogoAtivo {
  npc: string;
  papel: string;
  cor: string;
  texto: string;
  escolhas: { texto: string; idx: number }[];
}

export interface QuestView {
  id: string;
  titulo: string;
  tipo: "principal" | "secundaria";
  objetivo: string;
  progresso: number;
  alvo: number;
  estado: "ativa" | "concluida";
  destino?: [number, number];
}

export interface HudState {
  hp: number;
  maxHp: number;
  energia: number;
  maxEnergia: number;
  moedas: number;
  relogio: string;
  fps: number;
  bioma: string;
  prompt: string | null;
  dialogo: DialogoAtivo | null;
  slots: Slot[];
  equipado: { arma: string | null; ferramenta: string | null };
  quests: QuestView[];
  destino: [number, number] | null;
  jogador: { x: number; z: number; ang: number };
  npcs: { x: number; z: number; nome: string }[];
  inimigos: { x: number; z: number; boss: boolean }[];
  coletaveis: { x: number; z: number }[];
  marcos: { nome: string; x: number; z: number; kind: string }[];
  boss: { hp: number; max: number; nome: string } | null;
  toast: string | null;
  morto: boolean;
}

const SLOTS = 24;

export class Game {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera: THREE.PerspectiveCamera;
  input: InputManager;
  audio = new AudioEngine();
  settings: Settings = { ...DEFAULT_SETTINGS };
  bindings: Bindings = { ...DEFAULT_BINDINGS };
  pausado = false;
  private container: HTMLElement;
  private world!: WorldRefs;
  private colliders: Collider[] = [];
  private sun!: THREE.DirectionalLight;
  private sky!: THREE.Mesh;
  private fogPadrao: THREE.Fog;
  aparencia: Aparencia;
  hotbarSel = 0;
  private remotos = new Map<string, Remoto>();

  // Jogador
  private player: CharacterParts;
  private pos = new THREE.Vector3(6, 0, -4);
  private vel = new THREE.Vector3();
  private noChao = true;
  private naAgua = false;
  private anim: AnimState = "idle";
  private facing = 0;
  private spinTimer = 0;
  private attackTimer = 0;
  private interactTimer = 0;
  private invuln = 0;

  // Câmera
  private camYaw = 0;
  private camPitch = 0.35;
  private camDist = 8.5;

  // Estado de jogo
  hp = 100;
  maxHp = 100;
  energia = 100;
  maxEnergia = 100;
  moedas = 25;
  slots: Slot[] = new Array(SLOTS).fill(null).map(() => ({ id: "", qtd: 0 }));
  equipado: { arma: string | null; ferramenta: string | null } = { arma: "espada", ferramenta: null };
  quests: Record<string, { estado: "ativa" | "concluida"; progresso: number }> = {};
  flags: Record<string, boolean> = {};
  private slimesMortos = 0;
  private tempo = 8 * 60; // minutos no relógio do jogo (começa 08:00)

  private npcs: Npc[] = [];
  private inimigos: Enemy[] = [];
  private pickups: Pickup[] = [];
  private boss: Enemy | null = null;
  private dialogoNpc: NpcDef | null = null;
  private dialogoNo: DialogoNo | null = null;
  private toast: string | null = null;
  private toastT = 0;
  private morto = false;

  private clock = new THREE.Clock();
  private frames = 0;
  private fpsT = 0;
  private fps = 0;
  private raf = 0;
  private saveT = 0;
  private stepT = 0;

  onState: (s: HudState) => void = () => {};

  constructor(container: HTMLElement, opts: GameOptions = {}) {
    this.container = container;
    this.aparencia = opts.aparencia ?? { ...APARENCIA_PADRAO };
    const av = opts.avatar ?? AVATAR_PADRAO;
    this.player = createCharacter({
      skin: av.pele,
      shirt: av.camisa,
      pants: av.calca,
      hair: av.corCabelo,
      hairStyle: av.cabelo,
      hat: av.chapeu,
      glasses: av.oculos,
      scale: av.altura,
    });
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 600);
    this.fogPadrao = new THREE.Fog(0xbfeaff, 90, 260);
    this.scene.fog = this.fogPadrao;
    this.scene.background = new THREE.Color(0xa8e6ff);

    this.input = new InputManager(
      this.renderer.domElement,
      () => this.onEscape(),
      (code) => this.onHotkey(code),
    );

    this.buildScene();
    this.aplicarAparencia(this.aparencia);
    window.addEventListener("resize", this.resize);
    void this.carregar();
    this.loop();
  }

  onEscape: () => void = () => {};
  onHotkey: (code: string) => void = () => {};

  /* --------------------- Aparência / texturas -------------------- */
  aplicarAparencia(ap: Aparencia) {
    this.aparencia = ap;
    aplicarAparenciaCena(ap, this.scene, this.renderer, this.fogPadrao);
  }

  /** Seleciona um slot da hotbar (estilo Minecraft) */
  selecionarHotbar(i: number) {
    this.hotbarSel = Math.max(0, Math.min(8, i));
    this.emit();
  }

  /* ------------------------ Multiplayer ------------------------- */
  /** Posição/estado do jogador local, enviado para os outros jogadores */
  estadoRede() {
    return { x: this.pos.x, y: this.pos.y, z: this.pos.z, ang: this.player.root.rotation.y, anim: this.anim };
  }

  /** Sincroniza os avatares dos jogadores remotos */
  sincronizarRemotos(lista: RemotoInfo[]) {
    const vistos = new Set<string>();
    for (const r of lista) {
      vistos.add(r.id);
      let rem = this.remotos.get(r.id);
      if (!rem) {
        const partes = createCharacter({
          skin: r.avatar?.pele,
          shirt: r.avatar?.camisa,
          pants: r.avatar?.calca,
          hair: r.avatar?.corCabelo,
          hairStyle: r.avatar?.cabelo,
          hat: r.avatar?.chapeu,
          glasses: r.avatar?.oculos,
          scale: r.avatar?.altura ?? 1,
        });
        this.scene.add(partes.root);
        rem = { partes, alvo: new THREE.Vector3(r.x, r.y, r.z), nome: r.nome, anim: "idle" };
        this.remotos.set(r.id, rem);
      }
      rem.alvo.set(r.x, r.y, r.z);
      rem.nome = r.nome;
      rem.anim = (r.anim as AnimState) ?? "idle";
      rem.partes.root.rotation.y = r.ang;
    }
    for (const [id, rem] of this.remotos) {
      if (!vistos.has(id)) {
        this.scene.remove(rem.partes.root);
        this.remotos.delete(id);
      }
    }
  }

  private atualizarRemotos(dt: number) {
    for (const rem of this.remotos.values()) {
      rem.partes.root.position.lerp(rem.alvo, Math.min(1, dt * 8));
      animateCharacter(rem.partes, rem.anim, this.clock.elapsedTime, dt);
    }
  }


  /* ------------------------- Construção ------------------------- */
  private buildScene() {
    this.sky = buildSky(this.scene);
    const terrain = buildTerrain(200);
    this.scene.add(terrain);
    this.world = buildWorld(this.scene);
    this.colliders = this.world.colliders;

    const hemi = new THREE.HemisphereLight(0xdff4ff, 0x8fd06a, 1.15);
    this.scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff3d0, 1.5);
    sun.position.set(50, 90, 30);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    const c = sun.shadow.camera as THREE.OrthographicCamera;
    c.left = -45;
    c.right = 45;
    c.top = 45;
    c.bottom = -45;
    c.far = 220;
    this.scene.add(sun, sun.target);
    this.sun = sun;

    // Jogador
    this.pos.set(6, heightAt(6, -4), -4);
    this.player.root.position.copy(this.pos);
    this.scene.add(this.player.root);

    // NPCs
    for (const def of NPCS) {
      const n = new Npc(def);
      this.npcs.push(n);
      this.scene.add(n.root);
    }

    // Inimigos espalhados + boss nas ruínas
    const pontos: [number, number][] = [
      [-52, 26], [-60, 18], [-44, 34], [-66, 52], [-38, 46],
      [30, -40], [40, -52], [18, 20], [26, 46], [-20, 66],
      [10, 78], [-10, 92], [46, -70], [-70, -50], [-88, -60],
    ];
    for (const [x, z] of pontos) {
      const e = new Enemy("slime", x, z);
      this.inimigos.push(e);
      this.scene.add(e.root);
    }
    this.boss = new Enemy("boss", POI.ruinas.x + 2, POI.ruinas.y + 12);
    this.inimigos.push(this.boss);
    this.scene.add(this.boss.root);

    // Coletáveis pelo mundo
    const spawn = (id: string, cor: string, count: number, filtro: (x: number, z: number) => boolean) => {
      let guard = 0;
      let n = 0;
      while (n < count && guard++ < count * 60) {
        const x = (Math.random() - 0.5) * 280;
        const z = (Math.random() - 0.5) * 280;
        if (!filtro(x, z)) continue;
        const p = new Pickup(id, 1, x, z, cor);
        this.pickups.push(p);
        this.scene.add(p.root);
        n++;
      }
    };
    spawn("mel", "#ffb703", 8, (x, z) => heightAt(x, z) > WATER_LEVEL + 1 && Math.hypot(x - POI.campo.x, z - POI.campo.y) < 70);
    spawn("flor", "#ff5f9e", 14, (x, z) => heightAt(x, z) > WATER_LEVEL + 1 && heightAt(x, z) < 14);
    spawn("madeira", "#b5793f", 14, (x, z) => biomeAt(x, z) === "floresta");
    spawn("pedra", "#a89bbd", 12, (x, z) => heightAt(x, z) > 8);
    spawn("cristal", "#7ad7ff", 8, (x, z) => Math.hypot(x - POI.caverna.x, z - POI.caverna.y) < 30);
    spawn("concha", "#ffd6e0", 8, (x, z) => biomeAt(x, z) === "praia");
    spawn("maca", "#ff5f5f", 10, (x, z) => heightAt(x, z) > WATER_LEVEL + 1 && heightAt(x, z) < 12);

    // As três lanternas da missão principal
    const lanternas: [number, number][] = [
      [POI.caverna.x, POI.caverna.y - 3],
      [10, 118],
      [POI.montanha.x, POI.montanha.y + 4],
    ];
    for (const [x, z] of lanternas) {
      const p = new Pickup("lanterna", 1, x, z, "#ffe066");
      this.pickups.push(p);
      this.scene.add(p.root);
    }

    // Inventário inicial
    this.addItem("espada", 1);
    this.addItem("maca", 3);
  }

  /* ------------------------- Inventário ------------------------- */
  addItem(id: string, qtd = 1): boolean {
    const def = ITENS[id];
    if (!def) return false;
    if (def.empilhavel) {
      const s = this.slots.find((x) => x.id === id);
      if (s) {
        s.qtd += qtd;
        return true;
      }
    }
    const empty = this.slots.find((x) => !x.id);
    if (!empty) {
      this.notify("Inventário cheio!");
      return false;
    }
    empty.id = id;
    empty.qtd = qtd;
    return true;
  }

  countItem(id: string) {
    return this.slots.filter((s) => s.id === id).reduce((a, s) => a + s.qtd, 0);
  }

  removeItem(id: string, qtd = 1) {
    let restante = qtd;
    for (const s of this.slots) {
      if (s.id !== id) continue;
      const t = Math.min(s.qtd, restante);
      s.qtd -= t;
      restante -= t;
      if (s.qtd <= 0) {
        s.id = "";
        s.qtd = 0;
      }
      if (restante <= 0) break;
    }
  }

  usarSlot(i: number) {
    const s = this.slots[i];
    if (!s?.id) return;
    const def = ITENS[s.id];
    this.audio.start();
    if (def.kind === "consumivel") {
      this.hp = Math.min(this.maxHp, this.hp + (def.cura ?? 0));
      this.energia = Math.min(this.maxEnergia, this.energia + (def.energia ?? 0));
      this.removeItem(s.id, 1);
      this.audio.pickup();
      this.notify(`${def.nome} usado`);
    } else if (def.kind === "equipamento") {
      this.equipado.arma = this.equipado.arma === s.id ? null : s.id;
      this.audio.ui();
      this.notify(this.equipado.arma ? `${def.nome} equipada` : "Arma guardada");
    } else if (def.kind === "ferramenta") {
      this.equipado.ferramenta = this.equipado.ferramenta === s.id ? null : s.id;
      this.audio.ui();
    }
    this.emit();
  }

  moverSlot(de: number, para: number) {
    if (de === para) return;
    const a = this.slots[de];
    const b = this.slots[para];
    if (a.id && a.id === b.id && ITENS[a.id]?.empilhavel) {
      b.qtd += a.qtd;
      a.id = "";
      a.qtd = 0;
    } else {
      this.slots[de] = b;
      this.slots[para] = a;
    }
    this.emit();
  }

  podeCriar(receitaId: string) {
    const r = RECEITAS.find((x) => x.id === receitaId);
    return !!r && r.ingredientes.every((i) => this.countItem(i.id) >= i.qtd);
  }

  criar(receitaId: string) {
    const r = RECEITAS.find((x) => x.id === receitaId);
    if (!r || !this.podeCriar(receitaId)) return;
    for (const i of r.ingredientes) this.removeItem(i.id, i.qtd);
    this.addItem(r.resultado, r.qtd);
    this.audio.quest();
    this.notify(`${ITENS[r.resultado].nome} criado!`);
    this.emit();
  }

  /* --------------------------- Missões -------------------------- */
  private progressoQuest(id: string): number {
    const q = QUESTS[id];
    if (!q) return 0;
    if (q.contador === "matar:slime") return Math.min(this.slimesMortos, q.alvo);
    const item = q.contador.split(":")[1];
    return Math.min(this.countItem(item), q.alvo);
  }

  private notify(msg: string) {
    this.toast = msg;
    this.toastT = 2.6;
  }

  /* -------------------------- Diálogo --------------------------- */
  private npcProximo(): Npc | null {
    let melhor: Npc | null = null;
    let d = 3.6;
    for (const n of this.npcs) {
      const dist = n.root.position.distanceTo(this.pos);
      if (dist < d) {
        d = dist;
        melhor = n;
      }
    }
    return melhor;
  }

  private abrirDialogo(npc: Npc) {
    this.audio.start();
    this.audio.ui();
    npc.falando = true;
    this.dialogoNpc = npc.def;
    const q = npc.def.quest ? this.quests[npc.def.quest] : null;
    let noId = "start";
    if (npc.def.quest) {
      const def = QUESTS[npc.def.quest];
      if (q?.estado === "concluida") noId = "fim";
      else if (q?.estado === "ativa") noId = this.progressoQuest(def.id) >= def.alvo ? "entrega" : "andamento";
    }
    this.dialogoNo = npc.def.falas.find((f) => f.id === noId) ?? npc.def.falas[0];
    this.emit();
  }

  escolher(idx: number) {
    if (!this.dialogoNo || !this.dialogoNpc) return;
    const esc = this.dialogoNo.escolhas?.[idx];
    if (!esc) return;
    this.audio.ui();
    if (esc.evento === "aceitar_quest" && this.dialogoNpc.quest) {
      this.quests[this.dialogoNpc.quest] = { estado: "ativa", progresso: 0 };
      this.audio.quest();
      this.notify(`Nova missão: ${QUESTS[this.dialogoNpc.quest].titulo}`);
      this.fecharDialogo();
      return;
    }
    if (esc.evento === "entregar_quest" && this.dialogoNpc.quest) {
      const q = QUESTS[this.dialogoNpc.quest];
      this.quests[q.id] = { estado: "concluida", progresso: q.alvo };
      this.moedas += q.recompensa.moedas;
      for (const it of q.recompensa.itens) this.addItem(it.id, it.qtd);
      if (q.contador.startsWith("item:")) this.removeItem(q.contador.split(":")[1], q.alvo);
      this.audio.quest();
      this.notify(`Missão concluída: ${q.titulo} (+${q.recompensa.moedas} moedas)`);
      this.fecharDialogo();
      return;
    }
    if (esc.evento === "presente") {
      this.addItem("maca", 1);
      this.audio.pickup();
      this.notify("Você ganhou uma Maçã Doce");
      this.fecharDialogo();
      return;
    }
    if (esc.proximo) {
      this.dialogoNo = this.dialogoNpc.falas.find((f) => f.id === esc.proximo) ?? null;
      this.emit();
      return;
    }
    this.fecharDialogo();
  }

  fecharDialogo() {
    this.dialogoNo = null;
    this.dialogoNpc = null;
    for (const n of this.npcs) n.falando = false;
    this.emit();
  }

  /* --------------------------- Física --------------------------- */
  private resolverColisoes() {
    for (const c of this.colliders) {
      const dx = this.pos.x - c.x;
      const dz = this.pos.z - c.z;
      const d = Math.hypot(dx, dz);
      const min = c.r + 0.45;
      if (d < min && d > 0.0001) {
        const push = (min - d) / d;
        this.pos.x += dx * push;
        this.pos.z += dz * push;
      }
    }
    const lim = 150;
    this.pos.x = THREE.MathUtils.clamp(this.pos.x, -lim, lim);
    this.pos.z = THREE.MathUtils.clamp(this.pos.z, -lim, lim);
  }

  /* -------------------------- Combate --------------------------- */
  private atacar() {
    if (this.attackTimer > 0 || this.naAgua) return;
    this.audio.start();
    this.attackTimer = 0.42;
    this.audio.attack();
    const armaId = this.equipado.arma;
    const dano = armaId ? (ITENS[armaId]?.dano ?? 8) : 6;
    const alcance = armaId === "arco" ? 16 : armaId === "cajado" ? 9 : 3.2;
    const dir = new THREE.Vector3(Math.sin(this.facing), 0, Math.cos(this.facing));
    for (const e of this.inimigos) {
      if (!e.vivo) continue;
      const to = e.root.position.clone().sub(this.pos);
      const dist = to.length();
      if (dist > alcance + (e.kind === "boss" ? 2.4 : 0.8)) continue;
      if (alcance < 6 && to.normalize().dot(dir) < 0.25) continue;
      e.dañar(dano);
      this.audio.hit();
      this.spawnHitFx(e.root.position);
      if (!e.vivo) {
        this.moedas += e.kind === "boss" ? 250 : 12;
        if (e.kind === "slime") this.slimesMortos++;
        if (e.kind === "boss") {
          this.flags.boss = true;
          this.addItem("cristal", 3);
          this.notify("Rei Geleia derrotado! +250 moedas");
        } else if (Math.random() < 0.5) {
          this.addItem(Math.random() < 0.5 ? "cristal" : "maca", 1);
        }
        this.audio.quest();
      }
    }
  }

  // Pool de partículas de impacto
  private fxPool: THREE.Mesh[] = [];
  private fxAtivos: { m: THREE.Mesh; t: number; v: THREE.Vector3 }[] = [];
  private spawnHitFx(p: THREE.Vector3) {
    for (let i = 0; i < 8; i++) {
      let m = this.fxPool.pop();
      if (!m) {
        m = new THREE.Mesh(new THREE.TetrahedronGeometry(0.16), toon("#fff2a8"));
        this.scene.add(m);
      }
      m.visible = true;
      m.position.copy(p).add(new THREE.Vector3(0, 0.6, 0));
      const v = new THREE.Vector3(Math.random() - 0.5, Math.random() * 0.9 + 0.3, Math.random() - 0.5).multiplyScalar(6);
      this.fxAtivos.push({ m, t: 0.55, v });
    }
  }
  private updateFx(dt: number) {
    for (let i = this.fxAtivos.length - 1; i >= 0; i--) {
      const f = this.fxAtivos[i];
      f.t -= dt;
      f.v.y -= 16 * dt;
      f.m.position.addScaledVector(f.v, dt);
      f.m.rotation.x += dt * 6;
      f.m.rotation.y += dt * 5;
      if (f.t <= 0) {
        f.m.visible = false;
        this.fxPool.push(f.m);
        this.fxAtivos.splice(i, 1);
      }
    }
  }

  /* ---------------------------- Loop ---------------------------- */
  private loop = () => {
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const t = this.clock.elapsedTime;

    this.frames++;
    this.fpsT += dt;
    if (this.fpsT > 0.5) {
      this.fps = Math.round(this.frames / this.fpsT);
      this.frames = 0;
      this.fpsT = 0;
    }

    if (!this.pausado && !this.dialogoNo && !this.morto) {
      this.tick(dt, t);
    } else {
      animateCharacter(this.player, this.dialogoNo ? "interact" : "idle", t);
      for (const n of this.npcs) n.update(0, t, this.pos);
    }

    this.world.update(t, this.pos, this.settings.distancia);
    for (const p of this.pickups) p.update(t);
    this.updateFx(dt);

    // Luz acompanha o jogador para sombras nítidas
    this.sun.position.set(this.pos.x + 45, this.pos.y + 80, this.pos.z + 28);
    this.sky.position.copy(this.camera.position);
    this.sun.target.position.copy(this.pos);

    this.renderer.render(this.scene, this.camera);

    this.saveT += dt;
    if (this.saveT > 12) {
      this.saveT = 0;
      void this.salvar();
    }
    this.toastT -= dt;
    if (this.toastT <= 0 && this.toast) this.toast = null;

    this.emitT += dt;
    if (this.emitT > 0.1) {
      this.emitT = 0;
      this.emit();
    }
  };
  private emitT = 0;

  private tick(dt: number, t: number) {
    this.input.sensitivity = this.settings.sensibilidade;
    this.input.bindings = this.bindings;
    this.input.update();
    const s = this.input.state;

    // Câmera orbital em terceira pessoa
    const look = this.input.consumeLook();
    this.camYaw -= look.x;
    this.camPitch = THREE.MathUtils.clamp(this.camPitch + (this.settings.inverterY ? -look.y : look.y), -0.35, 1.05);
    this.camDist = THREE.MathUtils.clamp(this.camDist + this.input.zoomDelta, 4, 16);
    this.input.zoomDelta = 0;

    // Direção do movimento relativa à câmera
    const fwd = new THREE.Vector3(Math.sin(this.camYaw), 0, Math.cos(this.camYaw));
    const right = new THREE.Vector3(fwd.z, 0, -fwd.x);
    const dir = new THREE.Vector3()
      .addScaledVector(fwd, s.moveY)
      .addScaledVector(right, s.moveX);
    const movendo = dir.lengthSq() > 0.001;
    if (movendo) dir.normalize();

    const querCorrer = s.run && this.energia > 1 && movendo && !this.naAgua;
    const vmax = this.naAgua ? 3.4 : querCorrer ? 9.5 : 5;
    if (querCorrer) this.energia = Math.max(0, this.energia - 18 * dt);
    else this.energia = Math.min(this.maxEnergia, this.energia + 12 * dt);

    // Aceleração horizontal com atrito
    const alvo = dir.multiplyScalar(vmax);
    this.vel.x = THREE.MathUtils.lerp(this.vel.x, alvo.x, 1 - Math.pow(0.001, dt));
    this.vel.z = THREE.MathUtils.lerp(this.vel.z, alvo.z, 1 - Math.pow(0.001, dt));

    // Gravidade / natação / pulo
    const chao = heightAt(this.pos.x, this.pos.z);
    this.naAgua = this.pos.y < WATER_LEVEL - 0.2 && chao < WATER_LEVEL - 0.4;
    if (this.naAgua) {
      this.vel.y += (s.jump ? 9 : 2.6) * dt * 6 - this.vel.y * 3 * dt;
      this.vel.y = THREE.MathUtils.clamp(this.vel.y, -3, 4);
      const alvoY = WATER_LEVEL - 0.55;
      this.pos.y = THREE.MathUtils.lerp(this.pos.y, s.jump ? alvoY + 0.3 : alvoY, 3 * dt);
    } else {
      this.vel.y -= 26 * dt;
      if (s.jumpPressed && this.noChao) {
        this.vel.y = 11;
        this.noChao = false;
        this.audio.start();
        this.audio.jump();
      }
    }
    this.pos.y += this.vel.y * dt;
    this.pos.x += this.vel.x * dt;
    this.pos.z += this.vel.z * dt;
    this.resolverColisoes();

    // Aterrissagem / rampas (o terreno é o colisor principal)
    const novoChao = heightAt(this.pos.x, this.pos.z);
    if (this.pos.y <= novoChao) {
      if (!this.noChao && this.vel.y < -12) this.audio.land();
      this.pos.y = novoChao;
      this.vel.y = 0;
      const antes = this.noChao;
      this.noChao = true;
      if (!antes) this.audio.land();
    } else if (this.pos.y > novoChao + 0.12) {
      this.noChao = false;
    }
    if (this.naAgua) this.noChao = false;

    // Rotação do personagem
    if (movendo) {
      this.facing = Math.atan2(this.vel.x, this.vel.z);
    }
    if (this.spinTimer > 0) {
      this.spinTimer -= dt;
      this.player.root.rotation.y += dt * 18;
    } else {
      this.player.root.rotation.y = THREE.MathUtils.lerp(
        this.player.root.rotation.y,
        this.facing,
        1 - Math.pow(0.0005, dt),
      );
    }
    // Giro especial: correr + pular ao mesmo tempo
    if (s.jumpPressed && querCorrer) this.spinTimer = 0.45;

    this.player.root.position.copy(this.pos);

    // Ações
    this.attackTimer = Math.max(0, this.attackTimer - dt);
    this.interactTimer = Math.max(0, this.interactTimer - dt);
    this.invuln = Math.max(0, this.invuln - dt);
    if (s.attackPressed) this.atacar();
    if (s.interactPressed) this.interagir();

    // Animação
    const vh = Math.hypot(this.vel.x, this.vel.z);
    let anim: AnimState = "idle";
    if (this.naAgua) anim = "swim";
    else if (this.spinTimer > 0) anim = "spin";
    else if (this.attackTimer > 0) anim = "attack";
    else if (this.interactTimer > 0) anim = "interact";
    else if (!this.noChao) anim = this.vel.y > 0 ? "jump" : "fall";
    else if (vh > 6.2) anim = "run";
    else if (vh > 0.4) anim = "walk";
    this.anim = anim;
    animateCharacter(this.player, anim, t, 1);

    // Passos
    if ((anim === "walk" || anim === "run") && this.noChao) {
      this.stepT -= dt * (anim === "run" ? 2.4 : 1.5);
      if (this.stepT <= 0) {
        this.stepT = 0.42;
        this.audio.step(biomeAt(this.pos.x, this.pos.z) === "praia");
      }
    }

    // NPCs e inimigos
    for (const n of this.npcs) n.update(dt, t, this.pos);
    for (const e of this.inimigos) {
      if (!e.vivo) continue;
      const dist = e.root.position.distanceTo(this.pos);
      if (dist > this.settings.distancia) {
        e.root.visible = false;
        continue;
      }
      e.root.visible = true;
      const bateu = e.update(dt, t, this.pos);
      if (bateu && this.invuln <= 0) {
        this.hp -= e.dano;
        this.invuln = 0.8;
        this.audio.damage();
        if (this.hp <= 0) this.morrer();
      }
    }

    // Coleta
    for (const p of this.pickups) {
      if (p.coletado) continue;
      if (p.root.position.distanceTo(this.pos) < 1.8) {
        if (this.addItem(p.id, p.qtd)) {
          p.coletado = true;
          p.root.visible = false;
          this.audio.start();
          this.audio.pickup();
          this.notify(`+${p.qtd} ${ITENS[p.id].nome}`);
        }
      }
    }

    // Áudio ambiente reativo
    const distAgua = Math.max(0, 1 - Math.abs(this.pos.y - WATER_LEVEL) / 8);
    this.audio.setWaterProximity(this.naAgua ? 1 : distAgua * 0.6);
    this.audio.setWindStrength(THREE.MathUtils.clamp(this.pos.y / 40, 0, 1));

    // Relógio do mundo (1 minuto real ≈ 1 hora no jogo)
    this.tempo = (this.tempo + dt * 60) % 1440;

    // Câmera segue com suavização e evita atravessar o terreno
    const alvoCam = new THREE.Vector3(
      this.pos.x - Math.sin(this.camYaw) * Math.cos(this.camPitch) * this.camDist,
      this.pos.y + 2.4 + Math.sin(this.camPitch) * this.camDist,
      this.pos.z - Math.cos(this.camYaw) * Math.cos(this.camPitch) * this.camDist,
    );
    const minY = heightAt(alvoCam.x, alvoCam.z) + 1.2;
    alvoCam.y = Math.max(alvoCam.y, minY, WATER_LEVEL + 0.8);
    this.camera.position.lerp(alvoCam, 1 - Math.pow(0.0015, dt));
    this.camera.lookAt(this.pos.x, this.pos.y + 1.5, this.pos.z);
  }

  private interagir() {
    const npc = this.npcProximo();
    if (npc) {
      this.abrirDialogo(npc);
      return;
    }
    this.interactTimer = 0.5;
    this.audio.start();
    this.audio.ui();
  }

  private morrer() {
    this.hp = 0;
    this.morto = true;
    this.audio.damage();
    this.emit();
  }

  reviver() {
    this.hp = this.maxHp;
    this.energia = this.maxEnergia;
    this.morto = false;
    this.moedas = Math.max(0, this.moedas - 20);
    this.pos.set(POI.vila.x, heightAt(POI.vila.x, POI.vila.y), POI.vila.y + 6);
    this.vel.set(0, 0, 0);
    this.emit();
  }

  /* ------------------------- Estado / UI ------------------------ */
  private emit() {
    const npc = this.dialogoNpc;
    const questAtiva = Object.entries(this.quests).find(([, v]) => v.estado === "ativa");
    const destino = questAtiva ? QUESTS[questAtiva[0]]?.destino ?? null : null;
    const prox = this.npcProximo();
    const h = Math.floor(this.tempo / 60);
    const m = Math.floor(this.tempo % 60);

    const state: HudState = {
      hp: Math.max(0, Math.round(this.hp)),
      maxHp: this.maxHp,
      energia: Math.round(this.energia),
      maxEnergia: this.maxEnergia,
      moedas: this.moedas,
      relogio: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
      fps: this.fps,
      bioma: biomeAt(this.pos.x, this.pos.z),
      prompt: prox ? `Falar com ${prox.def.nome}` : null,
      dialogo:
        npc && this.dialogoNo
          ? {
              npc: npc.nome,
              papel: npc.papel,
              cor: npc.cor.shirt,
              texto: this.dialogoNo.texto,
              escolhas: (this.dialogoNo.escolhas ?? []).map((e, i) => ({ texto: e.texto, idx: i })),
            }
          : null,
      slots: this.slots.map((s) => ({ ...s })),
      equipado: { ...this.equipado },
      quests: Object.entries(this.quests).map(([id, v]) => {
        const q = QUESTS[id];
        return {
          id,
          titulo: q.titulo,
          tipo: q.tipo,
          objetivo: q.objetivo,
          progresso: v.estado === "concluida" ? q.alvo : this.progressoQuest(id),
          alvo: q.alvo,
          estado: v.estado,
          destino: q.destino,
        };
      }),
      destino,
      jogador: { x: this.pos.x, z: this.pos.z, ang: this.player.root.rotation.y },
      npcs: this.npcs.map((n) => ({ x: n.root.position.x, z: n.root.position.z, nome: n.def.nome })),
      inimigos: this.inimigos.filter((e) => e.vivo).map((e) => ({ x: e.root.position.x, z: e.root.position.z, boss: e.kind === "boss" })),
      coletaveis: this.pickups.filter((p) => !p.coletado).map((p) => ({ x: p.root.position.x, z: p.root.position.z })),
      marcos: this.world.landmarks.map((l) => ({ nome: l.name, x: l.pos.x, z: l.pos.y, kind: l.kind })),
      boss:
        this.boss && this.boss.vivo && this.boss.root.position.distanceTo(this.pos) < 30
          ? { hp: Math.max(0, this.boss.hp), max: this.boss.maxHp, nome: "Rei Geleia" }
          : null,
      toast: this.toast,
      morto: this.morto,
    };
    this.onState(state);
  }

  /* ------------------------- Configuração ----------------------- */
  aplicarSettings(s: Settings) {
    this.settings = s;
    this.audio.setVolume("master", s.volumeMaster);
    this.audio.setVolume("music", s.volumeMusica);
    this.audio.setVolume("sfx", s.volumeEfeitos);
    this.renderer.shadowMap.enabled = s.sombras;
    const dpr = s.qualidade === "baixa" ? 0.7 : s.qualidade === "media" ? 1 : Math.min(devicePixelRatio, 2);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2) * (s.qualidade === "alta" ? 1 : dpr / Math.min(devicePixelRatio, 2)));
    this.renderer.setPixelRatio(s.qualidade === "alta" ? Math.min(devicePixelRatio, 2) : s.qualidade === "media" ? 1 : 0.7);
    this.camera.far = Math.max(300, s.distancia * 2.4);
    this.camera.updateProjectionMatrix();
    (this.scene.fog as THREE.Fog).far = s.distancia * 2;
    (this.scene.fog as THREE.Fog).near = s.distancia * 0.55;
    for (const o of this.scene.children) o.traverse?.((c) => {
      if ((c as THREE.Mesh).isMesh) (c as THREE.Mesh).castShadow = s.sombras && (c as THREE.Mesh).castShadow;
    });
  }

  /* ----------------------------- Save --------------------------- */
  async salvar() {
    const data: SaveData = {
      version: 1,
      player: { x: this.pos.x, y: this.pos.y, z: this.pos.z, hp: this.hp, maxHp: this.maxHp, stamina: this.energia },
      coins: this.moedas,
      items: this.slots.reduce<Record<string, number>>((acc, s) => {
        if (s.id) acc[s.id] = (acc[s.id] ?? 0) + s.qtd;
        return acc;
      }, {}),
      equipped: this.equipado,
      quests: this.quests,
      flags: { ...this.flags, slimes: this.slimesMortos > 0 },
      settings: this.settings,
      tempo: this.tempo,
      jogadoEm: Date.now(),
    };
    (data.flags as Record<string, unknown>).slimesMortos = this.slimesMortos;
    await saveGame(data);
  }

  async carregar() {
    const d = await loadGame();
    if (!d) return;
    this.pos.set(d.player.x, d.player.y, d.player.z);
    this.hp = d.player.hp;
    this.maxHp = d.player.maxHp;
    this.energia = d.player.stamina;
    this.moedas = d.coins;
    this.slots = new Array(SLOTS).fill(null).map(() => ({ id: "", qtd: 0 }));
    for (const [id, qtd] of Object.entries(d.items)) this.addItem(id, qtd);
    this.equipado = d.equipped;
    this.quests = d.quests ?? {};
    this.flags = d.flags ?? {};
    this.slimesMortos = Number((d.flags as Record<string, unknown>)?.slimesMortos ?? 0);
    this.tempo = d.tempo ?? 480;
    if (d.settings) {
      this.settings = { ...DEFAULT_SETTINGS, ...d.settings };
      this.aplicarSettings(this.settings);
    }
    this.notify("Jogo carregado");
    this.emit();
  }

  private resize = () => {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  };

  dispose() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.resize);
    this.input.dispose();
    this.audio.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
