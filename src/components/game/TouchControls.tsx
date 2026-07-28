/** Controles de toque: joystick analógico + botões de ação com ícones SVG. */
import { useEffect, useRef, useState } from "react";
import { ChevronsUp, Hand, Sword, Footprints } from "lucide-react";

interface Props {
  onMove: (x: number, y: number) => void;
  onButton: (b: "jump" | "attack" | "interact", pressed: boolean) => void;
  onRun: (v: boolean) => void;
  onLook: (dx: number, dy: number) => void;
}

export function TouchControls({ onMove, onButton, onRun, onLook }: Props) {
  const zona = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const idRef = useRef<number | null>(null);
  const [correndo, setCorrendo] = useState(false);

  useEffect(() => {
    const el = zona.current;
    if (!el) return;
    const raio = 52;

    const atualizar = (t: Touch) => {
      const r = el.getBoundingClientRect();
      let dx = t.clientX - (r.left + r.width / 2);
      let dy = t.clientY - (r.top + r.height / 2);
      const d = Math.hypot(dx, dy);
      if (d > raio) {
        dx = (dx / d) * raio;
        dy = (dy / d) * raio;
      }
      setKnob({ x: dx, y: dy });
      onMove(dx / raio, -dy / raio);
    };

    const start = (e: TouchEvent) => {
      const t = e.changedTouches[0];
      idRef.current = t.identifier;
      atualizar(t);
      e.preventDefault();
    };
    const move = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier === idRef.current) atualizar(t);
      }
      e.preventDefault();
    };
    const end = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier === idRef.current) {
          idRef.current = null;
          setKnob({ x: 0, y: 0 });
          onMove(0, 0);
        }
      }
    };
    el.addEventListener("touchstart", start, { passive: false });
    window.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("touchend", end);
    window.addEventListener("touchcancel", end);
    return () => {
      el.removeEventListener("touchstart", start);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", end);
      window.removeEventListener("touchcancel", end);
    };
  }, [onMove]);

  // Arrastar na metade direita da tela gira a câmera
  useEffect(() => {
    let id: number | null = null;
    let last = { x: 0, y: 0 };
    const start = (e: TouchEvent) => {
      const t = e.changedTouches[0];
      if (t.clientX < window.innerWidth * 0.45) return;
      if ((e.target as HTMLElement).closest("[data-botao]")) return;
      id = t.identifier;
      last = { x: t.clientX, y: t.clientY };
    };
    const move = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier !== id) continue;
        onLook((t.clientX - last.x) * 0.006, (t.clientY - last.y) * 0.004);
        last = { x: t.clientX, y: t.clientY };
      }
    };
    const end = () => {
      id = null;
    };
    window.addEventListener("touchstart", start, { passive: true });
    window.addEventListener("touchmove", move, { passive: true });
    window.addEventListener("touchend", end);
    return () => {
      window.removeEventListener("touchstart", start);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", end);
    };
  }, [onLook]);

  const Botao = ({
    id,
    label,
    children,
    className,
    onPress,
    toggle,
  }: {
    id: string;
    label: string;
    children: React.ReactNode;
    className?: string;
    onPress?: (v: boolean) => void;
    toggle?: boolean;
  }) => {
    const [ativo, setAtivo] = useState(false);
    return (
      <button
        data-botao={id}
        aria-label={label}
        className={`botao-toque grid place-items-center rounded-full ${ativo ? "botao-toque-ativo" : ""} ${className ?? ""}`}
        onTouchStart={(e) => {
          e.preventDefault();
          if (toggle) {
            const v = !correndo;
            setCorrendo(v);
            setAtivo(v);
            onPress?.(v);
          } else {
            setAtivo(true);
            onPress?.(true);
          }
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          if (!toggle) {
            setAtivo(false);
            onPress?.(false);
          }
        }}
      >
        {children}
      </button>
    );
  };

  return (
    <div className="pointer-events-none absolute inset-0 sm:hidden">
      {/* Joystick */}
      <div
        ref={zona}
        className="pointer-events-auto absolute bottom-10 left-6 size-32 rounded-full border-2 border-hud-border bg-hud-foreground/10 backdrop-blur-md"
        style={{ touchAction: "none" }}
      >
        <div
          className="absolute left-1/2 top-1/2 size-14 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-hud-border bg-hud-foreground/35"
          style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }}
        />
      </div>

      {/* Botões de ação */}
      <div className="pointer-events-auto absolute bottom-8 right-6 grid grid-cols-2 gap-3">
        <Botao id="correr" label="Correr" className="size-14 self-end" toggle onPress={onRun}>
          <Footprints className="size-6" />
        </Botao>
        <Botao id="pular" label="Pular" className="size-16" onPress={(v) => onButton("jump", v)}>
          <ChevronsUp className="size-7" />
        </Botao>
        <Botao id="interagir" label="Interagir" className="size-14" onPress={(v) => onButton("interact", v)}>
          <Hand className="size-6" />
        </Botao>
        <Botao id="atacar" label="Atacar" className="size-16" onPress={(v) => onButton("attack", v)}>
          <Sword className="size-7" />
        </Botao>
      </div>
    </div>
  );
}
