/** Orquestra o motor 3D e toda a interface do LITE. */
import { useCallback, useEffect, useRef, useState } from "react";
import { Backpack, Map as MapIcon, Pause, Scroll } from "lucide-react";
import { Game, type HudState } from "@/game/engine";
import { DEFAULT_SETTINGS, type Settings } from "@/game/save";
import { Hud } from "./Hud";
import { TouchControls } from "./TouchControls";
import { Dialogo } from "./Dialogo";
import { Inventario } from "./Inventario";
import { ConfigPanel, MapaPanel, MissoesPanel, PausaPanel } from "./Paineis";

type Painel = null | "inv" | "mapa" | "quests" | "config" | "pausa";

export function GameShell() {
  const boxRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [state, setState] = useState<HudState | null>(null);
  const [painel, setPainel] = useState<Painel>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [iniciado, setIniciado] = useState(false);
  const painelRef = useRef<Painel>(null);
  painelRef.current = painel;

  useEffect(() => {
    if (!boxRef.current) return;
    const g = new Game(boxRef.current);
    gameRef.current = g;
    g.onState = setState;
    g.onEscape = () => setPainel((p) => (p ? null : "pausa"));
    g.onHotkey = (code) => {
      const map: Record<string, Painel> = { KeyI: "inv", KeyM: "mapa", KeyQ: "quests", KeyO: "config", KeyC: "inv" };
      const alvo = map[code];
      if (alvo) setPainel((p) => (p === alvo ? null : alvo));
    };
    return () => g.dispose();
  }, []);

  // Pausa a simulação sempre que um painel está aberto
  useEffect(() => {
    if (gameRef.current) gameRef.current.pausado = painel !== null;
  }, [painel]);

  const aplicar = useCallback((s: Settings) => {
    setSettings(s);
    gameRef.current?.aplicarSettings(s);
  }, []);

  const iniciar = () => {
    setIniciado(true);
    gameRef.current?.audio.start();
    gameRef.current?.aplicarSettings(settings);
  };

  const onMove = useCallback((x: number, y: number) => {
    const t = gameRef.current?.input.touch;
    if (t) {
      t.x = x;
      t.y = y;
    }
  }, []);
  const onButton = useCallback((b: "jump" | "attack" | "interact", v: boolean) => {
    const tb = gameRef.current?.input.touchButtons;
    if (tb) tb[b] = v;
  }, []);
  const onRun = useCallback((v: boolean) => {
    const t = gameRef.current?.input.touch;
    if (t) t.run = v;
  }, []);
  const onLook = useCallback((dx: number, dy: number) => {
    const g = gameRef.current;
    if (g) {
      g.input.state.lookX += dx;
      g.input.state.lookY += dy;
    }
  }, []);

  const g = gameRef.current;

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-background">
      <div
        ref={boxRef}
        className="absolute inset-0"
        onPointerDown={() => gameRef.current?.audio.start()}
      />

      {state && <Hud s={state} mostrarFps={settings.mostrarFps} />}

      {/* Botões de menu (funcionam em toque e desktop) */}
      <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-2 sm:left-auto sm:right-3 sm:translate-x-0">
        {(
          [
            ["inv", <Backpack key="i" className="size-5" />, "Mochila"],
            ["mapa", <MapIcon key="m" className="size-5" />, "Mapa"],
            ["quests", <Scroll key="q" className="size-5" />, "Missões"],
            ["pausa", <Pause key="p" className="size-5" />, "Pausar"],
          ] as const
        ).map(([id, icon, label]) => (
          <button
            key={id}
            aria-label={label}
            onClick={() => setPainel((p) => (p === id ? null : (id as Painel)))}
            className="painel-hud grid size-11 place-items-center active:scale-90"
          >
            {icon}
          </button>
        ))}
      </div>

      {state?.dialogo && <Dialogo d={state.dialogo} onEscolher={(i) => gameRef.current?.escolher(i)} />}

      {painel === "inv" && state && g && (
        <Inventario
          slots={state.slots}
          equipado={state.equipado}
          moedas={state.moedas}
          podeCriar={(id) => g.podeCriar(id)}
          onUsar={(i) => g.usarSlot(i)}
          onMover={(a, b) => g.moverSlot(a, b)}
          onCriar={(id) => g.criar(id)}
          onFechar={() => setPainel(null)}
        />
      )}
      {painel === "mapa" && state && <MapaPanel s={state} onFechar={() => setPainel(null)} />}
      {painel === "quests" && state && <MissoesPanel s={state} onFechar={() => setPainel(null)} />}
      {painel === "config" && <ConfigPanel settings={settings} onChange={aplicar} onFechar={() => setPainel(null)} />}
      {painel === "pausa" && (
        <PausaPanel
          onContinuar={() => setPainel(null)}
          onConfig={() => setPainel("config")}
          onReiniciar={() => {
            gameRef.current?.reviver();
            setPainel(null);
          }}
        />
      )}

      {state?.morto && (
        <div className="absolute inset-0 z-40 grid place-items-center bg-destructive/30 backdrop-blur-sm">
          <div className="painel-pop p-6 text-center">
            <h2 className="fonte-display text-2xl font-black">Você desmaiou...</h2>
            <p className="mt-1 text-sm opacity-85">Os moradores te levaram de volta para a Vila Pétala.</p>
            <button
              onClick={() => gameRef.current?.reviver()}
              className="mt-4 rounded-xl border-2 border-hud-border bg-hud-foreground/15 px-5 py-2 font-bold active:scale-95"
            >
              Acordar
            </button>
          </div>
        </div>
      )}

      {!iniciado && (
        <div className="absolute inset-0 z-50 grid place-items-center bg-foreground/55 p-4 backdrop-blur-md">
          <div className="painel-pop max-w-sm p-6 text-center">
            <h1 className="fonte-display text-4xl font-black tracking-tight">LITE</h1>
            <p className="mt-1 text-sm font-semibold uppercase tracking-[0.25em] opacity-80">Mundo Aberto</p>
            <p className="mt-4 text-sm leading-relaxed opacity-90">
              Explore florestas, vilas, lagos, montanhas, cavernas, ruínas e praias em um mundo contínuo. Faça missões,
              crie itens e enfrente o Rei Geleia.
            </p>
            <button
              onClick={iniciar}
              className="mt-5 w-full rounded-xl border-2 border-hud-border bg-hud-foreground/20 px-4 py-3 text-lg font-bold active:scale-95"
            >
              Começar aventura
            </button>
            <p className="mt-3 text-[11px] opacity-70">
              Desktop: WASD, mouse e gamepad. Celular: joystick e botões na tela.
            </p>
          </div>
        </div>
      )}

      <TouchControls onMove={onMove} onButton={onButton} onRun={onRun} onLook={onLook} />
    </div>
  );
}
