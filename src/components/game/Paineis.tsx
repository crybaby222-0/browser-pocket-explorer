/** Mapa-múndi, registro de missões e configurações. */
import { useEffect, useRef } from "react";
import { Map as MapIcon, Scroll, Settings as Cog, X, Play, RotateCcw, Maximize } from "lucide-react";
import type { HudState } from "@/game/engine";
import type { Settings } from "@/game/save";
import { desenharMapa } from "./mapDraw";

export function MapaPanel({ s, onFechar }: { s: HudState; onFechar: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    const ctx = c?.getContext("2d");
    if (c && ctx) desenharMapa(ctx, s, c.width, 320, true);
  }, [s]);
  return (
    <Overlay titulo="Mapa de Pétala" icone={<MapIcon className="size-5 text-moeda" />} onFechar={onFechar}>
      <canvas ref={ref} width={520} height={520} className="mx-auto w-full max-w-[520px] rounded-2xl border-2 border-hud-border" />
    </Overlay>
  );
}

export function MissoesPanel({ s, onFechar }: { s: HudState; onFechar: () => void }) {
  return (
    <Overlay titulo="Missões" icone={<Scroll className="size-5 text-moeda" />} onFechar={onFechar}>
      {s.quests.length === 0 && <p className="text-sm opacity-80">Converse com os moradores da vila para receber missões.</p>}
      <div className="grid gap-2">
        {s.quests.map((q) => (
          <div key={q.id} className="rounded-xl border-2 border-hud-border bg-hud-foreground/10 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide opacity-70">
              {q.tipo === "principal" ? "Principal" : "Secundária"} · {q.estado === "concluida" ? "Concluída" : "Em andamento"}
            </p>
            <p className="fonte-display text-base font-bold">{q.titulo}</p>
            <p className="text-sm opacity-90">{q.objetivo}</p>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-hud-foreground/20">
              <div className="h-full bg-moeda" style={{ width: `${(q.progresso / q.alvo) * 100}%` }} />
            </div>
            <p className="mt-1 text-xs font-bold tabular-nums">
              {q.progresso}/{q.alvo}
            </p>
          </div>
        ))}
      </div>
    </Overlay>
  );
}

function Linha({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border-2 border-hud-border bg-hud-foreground/10 px-3 py-2 text-sm font-semibold">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function ConfigPanel({
  settings,
  onChange,
  onFechar,
}: {
  settings: Settings;
  onChange: (s: Settings) => void;
  onFechar: () => void;
}) {
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => onChange({ ...settings, [k]: v });
  const slider = (k: keyof Settings, min = 0, max = 1, step = 0.05) => (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={settings[k] as number}
      onChange={(e) => set(k, Number(e.target.value) as never)}
      className="w-36 accent-[var(--moeda)]"
    />
  );
  return (
    <Overlay titulo="Configurações" icone={<Cog className="size-5 text-moeda" />} onFechar={onFechar}>
      <div className="grid gap-2 sm:grid-cols-2">
        <Linha label="Volume geral">{slider("volumeMaster")}</Linha>
        <Linha label="Música">{slider("volumeMusica")}</Linha>
        <Linha label="Efeitos">{slider("volumeEfeitos")}</Linha>
        <Linha label="Sensibilidade">{slider("sensibilidade", 0.3, 2.5, 0.1)}</Linha>
        <Linha label="Distância de renderização">
          <input
            type="range"
            min={60}
            max={260}
            step={10}
            value={settings.distancia}
            onChange={(e) => set("distancia", Number(e.target.value))}
            className="w-36 accent-[var(--moeda)]"
          />
        </Linha>
        <Linha label="Qualidade gráfica">
          <select
            value={settings.qualidade}
            onChange={(e) => set("qualidade", e.target.value as Settings["qualidade"])}
            className="rounded-lg border-2 border-hud-border bg-transparent px-2 py-1 text-sm"
          >
            <option value="baixa">Baixa</option>
            <option value="media">Média</option>
            <option value="alta">Alta</option>
          </select>
        </Linha>
        <Linha label="Idioma">
          <select
            value={settings.idioma}
            onChange={(e) => set("idioma", e.target.value as Settings["idioma"])}
            className="rounded-lg border-2 border-hud-border bg-transparent px-2 py-1 text-sm"
          >
            <option value="pt">Português</option>
            <option value="en">English</option>
          </select>
        </Linha>
        <Linha label="Sombras">
          <input type="checkbox" checked={settings.sombras} onChange={(e) => set("sombras", e.target.checked)} className="size-5 accent-[var(--moeda)]" />
        </Linha>
        <Linha label="Mostrar FPS">
          <input type="checkbox" checked={settings.mostrarFps} onChange={(e) => set("mostrarFps", e.target.checked)} className="size-5 accent-[var(--moeda)]" />
        </Linha>
        <Linha label="Inverter eixo Y">
          <input type="checkbox" checked={settings.inverterY} onChange={(e) => set("inverterY", e.target.checked)} className="size-5 accent-[var(--moeda)]" />
        </Linha>
        <Linha label="Tela cheia">
          <button
            onClick={() =>
              document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()
            }
            className="flex items-center gap-1 rounded-lg border-2 border-hud-border px-2 py-1 text-xs font-bold"
          >
            <Maximize className="size-3.5" /> Alternar
          </button>
        </Linha>
      </div>
      <p className="mt-3 text-xs opacity-75">
        Controles: WASD mover · Shift correr · Espaço pular · J atacar · E interagir · I mochila · M mapa · Q missões · O
        configurações · Esc pausar · Gamepad suportado.
      </p>
    </Overlay>
  );
}

export function PausaPanel({
  onContinuar,
  onConfig,
  onReiniciar,
}: {
  onContinuar: () => void;
  onConfig: () => void;
  onReiniciar: () => void;
}) {
  return (
    <div className="pointer-events-auto absolute inset-0 z-40 grid place-items-center bg-foreground/50 p-4 backdrop-blur-sm">
      <div className="painel-pop w-full max-w-xs p-5 text-center">
        <h2 className="fonte-display text-2xl font-black">LITE</h2>
        <p className="mb-4 text-xs uppercase tracking-[0.2em] opacity-75">Pausado</p>
        <div className="grid gap-2">
          <button onClick={onContinuar} className="flex items-center justify-center gap-2 rounded-xl border-2 border-hud-border bg-hud-foreground/15 px-3 py-2 font-bold active:scale-95">
            <Play className="size-4" /> Continuar
          </button>
          <button onClick={onConfig} className="flex items-center justify-center gap-2 rounded-xl border-2 border-hud-border px-3 py-2 font-bold active:scale-95">
            <Cog className="size-4" /> Configurações
          </button>
          <button onClick={onReiniciar} className="flex items-center justify-center gap-2 rounded-xl border-2 border-hud-border px-3 py-2 font-bold active:scale-95">
            <RotateCcw className="size-4" /> Voltar à vila
          </button>
        </div>
      </div>
    </div>
  );
}

function Overlay({
  titulo,
  icone,
  children,
  onFechar,
}: {
  titulo: string;
  icone: React.ReactNode;
  children: React.ReactNode;
  onFechar: () => void;
}) {
  return (
    <div className="pointer-events-auto absolute inset-0 z-40 grid place-items-center bg-foreground/40 p-3 backdrop-blur-sm">
      <div className="painel-pop max-h-[92vh] w-full max-w-2xl overflow-y-auto p-4">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="fonte-display flex items-center gap-2 text-lg font-bold">
            {icone}
            {titulo}
          </h2>
          <button aria-label="Fechar" onClick={onFechar} className="ml-auto rounded-lg border-2 border-hud-border p-1.5">
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
