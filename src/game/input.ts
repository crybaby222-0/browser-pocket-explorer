/**
 * LITE - Entrada unificada: teclado (WASD configurável), mouse, gamepad e toque.
 */
export interface InputState {
  moveX: number; // -1 esquerda / 1 direita
  moveY: number; // -1 trás / 1 frente
  lookX: number;
  lookY: number;
  run: boolean;
  jump: boolean;
  attack: boolean;
  interact: boolean;
  jumpPressed: boolean;
  attackPressed: boolean;
  interactPressed: boolean;
}

export type Bindings = Record<"frente" | "tras" | "esquerda" | "direita" | "pular" | "correr" | "atacar" | "interagir", string>;

export const DEFAULT_BINDINGS: Bindings = {
  frente: "KeyW",
  tras: "KeyS",
  esquerda: "KeyA",
  direita: "KeyD",
  pular: "Space",
  correr: "ShiftLeft",
  atacar: "KeyJ",
  interagir: "KeyE",
};

export class InputManager {
  state: InputState = {
    moveX: 0,
    moveY: 0,
    lookX: 0,
    lookY: 0,
    run: false,
    jump: false,
    attack: false,
    interact: false,
    jumpPressed: false,
    attackPressed: false,
    interactPressed: false,
  };
  bindings: Bindings = { ...DEFAULT_BINDINGS };
  sensitivity = 1;
  /** Estado do joystick virtual (mobile), alimentado pelo React */
  touch = { x: 0, y: 0, run: false };
  touchButtons = { jump: false, attack: false, interact: false };

  private keys = new Set<string>();
  private prevJump = false;
  private prevAttack = false;
  private prevInteract = false;
  private prevPadJump = false;
  private prevPadAttack = false;
  private prevPadInteract = false;
  private pointerLocked = false;
  private el: HTMLElement;
  private onPause: () => void;
  private onToggle: (k: string) => void;

  constructor(el: HTMLElement, onPause: () => void, onToggle: (k: string) => void) {
    this.el = el;
    this.onPause = onPause;
    this.onToggle = onToggle;
    window.addEventListener("keydown", this.keyDown);
    window.addEventListener("keyup", this.keyUp);
    el.addEventListener("mousemove", this.mouseMove);
    el.addEventListener("mousedown", this.mouseDown);
    el.addEventListener("mouseup", this.mouseUp);
    el.addEventListener("wheel", this.wheel, { passive: true });
    document.addEventListener("pointerlockchange", this.lockChange);
  }

  zoomDelta = 0;

  dispose() {
    window.removeEventListener("keydown", this.keyDown);
    window.removeEventListener("keyup", this.keyUp);
    this.el.removeEventListener("mousemove", this.mouseMove);
    this.el.removeEventListener("mousedown", this.mouseDown);
    this.el.removeEventListener("mouseup", this.mouseUp);
    this.el.removeEventListener("wheel", this.wheel);
    document.removeEventListener("pointerlockchange", this.lockChange);
  }

  requestLook() {
    if (!this.pointerLocked && this.el.requestPointerLock) this.el.requestPointerLock();
  }

  private lockChange = () => {
    this.pointerLocked = document.pointerLockElement === this.el;
  };

  private keyDown = (e: KeyboardEvent) => {
    if (e.code === "Escape") {
      this.onPause();
      return;
    }
    if (["KeyI", "KeyM", "KeyQ", "KeyC", "KeyO"].includes(e.code) && !e.repeat) {
      this.onToggle(e.code);
    }
    if (e.code === "Space") e.preventDefault();
    this.keys.add(e.code);
  };

  private keyUp = (e: KeyboardEvent) => this.keys.delete(e.code);

  private mouseMove = (e: MouseEvent) => {
    if (this.pointerLocked || e.buttons & 1 || e.buttons & 2) {
      this.state.lookX += e.movementX * 0.0026 * this.sensitivity;
      this.state.lookY += e.movementY * 0.0018 * this.sensitivity;
    }
  };

  private mouseDown = (e: MouseEvent) => {
    if (e.button === 0) this.mouseAttack = true;
  };
  private mouseUp = (e: MouseEvent) => {
    if (e.button === 0) this.mouseAttack = false;
  };
  private wheel = (e: WheelEvent) => {
    this.zoomDelta += e.deltaY * 0.004;
  };
  private mouseAttack = false;

  /** Recalcula o estado combinando todas as fontes. Chamado a cada frame. */
  update() {
    const k = this.keys;
    const b = this.bindings;
    let mx = (k.has(b.direita) || k.has("ArrowRight") ? 1 : 0) - (k.has(b.esquerda) || k.has("ArrowLeft") ? 1 : 0);
    let my = (k.has(b.frente) || k.has("ArrowUp") ? 1 : 0) - (k.has(b.tras) || k.has("ArrowDown") ? 1 : 0);
    let run = k.has(b.correr);
    let jump = k.has(b.pular);
    let attack = k.has(b.atacar) || this.mouseAttack;
    let interact = k.has(b.interagir);

    // Toque
    if (Math.abs(this.touch.x) > 0.01 || Math.abs(this.touch.y) > 0.01) {
      mx = this.touch.x;
      my = this.touch.y;
    }
    run = run || this.touch.run || this.touchButtons.jump === false ? run || this.touch.run : run;
    jump = jump || this.touchButtons.jump;
    attack = attack || this.touchButtons.attack;
    interact = interact || this.touchButtons.interact;

    // Gamepad API
    const pads = navigator.getGamepads?.() ?? [];
    const pad = pads.find((p) => p);
    if (pad) {
      const dz = (v: number) => (Math.abs(v) > 0.18 ? v : 0);
      const ax = dz(pad.axes[0] ?? 0);
      const ay = dz(pad.axes[1] ?? 0);
      if (ax || ay) {
        mx = ax;
        my = -ay;
      }
      this.state.lookX += dz(pad.axes[2] ?? 0) * 0.05 * this.sensitivity;
      this.state.lookY += dz(pad.axes[3] ?? 0) * 0.03 * this.sensitivity;
      const padJump = !!pad.buttons[0]?.pressed;
      const padAttack = !!pad.buttons[2]?.pressed;
      const padInteract = !!pad.buttons[1]?.pressed;
      run = run || !!pad.buttons[6]?.pressed || !!pad.buttons[10]?.pressed;
      jump = jump || padJump;
      attack = attack || padAttack;
      interact = interact || padInteract;
      this.prevPadJump = padJump;
      this.prevPadAttack = padAttack;
      this.prevPadInteract = padInteract;
    }

    const len = Math.hypot(mx, my);
    if (len > 1) {
      mx /= len;
      my /= len;
    }

    const s = this.state;
    s.moveX = mx;
    s.moveY = my;
    s.run = run;
    s.jumpPressed = jump && !this.prevJump;
    s.attackPressed = attack && !this.prevAttack;
    s.interactPressed = interact && !this.prevInteract;
    s.jump = jump;
    s.attack = attack;
    s.interact = interact;
    this.prevJump = jump;
    this.prevAttack = attack;
    this.prevInteract = interact;
  }

  consumeLook() {
    const x = this.state.lookX;
    const y = this.state.lookY;
    this.state.lookX = 0;
    this.state.lookY = 0;
    return { x, y };
  }
}
