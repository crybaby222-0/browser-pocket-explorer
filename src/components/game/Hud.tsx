/** HUD principal: vida, energia, moedas, relógio, minimapa, missão e boss. */
import { useEffect, useRef } from "react";
import { Coins, Clock, Gauge, Heart, Zap, MapPin, Target } from "lucide-react";
import type { HudState } from "@/game/engine";
import { desenharMapa } from "./mapDraw";

function Barra({ valor, max, cor, children }: { valor: number; max: number; cor: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="grid size-7 place-items-center rounded-full border-2 border-hud-border bg-hud-foreground/15">
        {children}
      </span>
      <div className="h-3 w-28 overflow-hidden rounded-full border-2 border-hud-border bg-hud-foreground/15 sm:w-40">
        <div
          className="h-full rounded-full transition-[width] duration-200"
          style={{ width: `${Math.max(0, (valor / max) * 100)}%`, background: cor }}
        />
      </div>
      <span className="w-12 text-xs font-bold tabular-nums">{Math.round(valor)}</span>
    </div>
  );
}

export function Hud({ s, mostrarFps }: { s: HudState; mostrarFps: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    desenharMapa(ctx, s, c.width, 110, false);
  }, [s]);

  const ativa = s.quests.find((q) => q.estado === "ativa");

  return (
    <div className="pointer-events-none absolute inset-0 select-none">
      {/* Vitais */}
      <div className="painel-hud absolute left-3 top-3 space-y-2 p-3">
        <Barra valor={s.hp} max={s.maxHp} cor="var(--vida)">
          <Heart className="size-4" />
        </Barra>
        <Barra valor={s.energia} max={s.maxEnergia} cor="var(--energia)">
          <Zap className="size-4" />
        </Barra>
        <div className="flex items-center gap-3 pt-0.5 text-xs font-bold">
          <span className="flex items-center gap-1">
            <Coins className="size-4 text-moeda" />
            {s.moedas}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="size-4" />
            {s.relogio}
          </span>
          {mostrarFps && (
            <span className="flex items-center gap-1">
              <Gauge className="size-4" />
              {s.fps}
            </span>
          )}
        </div>
      </div>

      {/* Minimapa */}
      <div className="painel-hud absolute right-3 top-3 overflow-hidden p-1.5">
        <canvas ref={ref} width={132} height={132} className="rounded-[10px]" />
        <p className="mt-1 text-center text-[10px] font-bold uppercase tracking-wide opacity-80">{s.bioma}</p>
      </div>

      {/* Rastreador de missão */}
      {ativa && (
        <div className="painel-hud absolute left-3 top-32 max-w-56 p-2.5 sm:top-36">
          <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide opacity-75">
            <Target className="size-3" />
            {ativa.tipo === "principal" ? "Missão principal" : "Missão secundária"}
          </p>
          <p className="fonte-display text-sm font-bold">{ativa.titulo}</p>
          <p className="text-xs opacity-85">
            {ativa.objetivo} — {ativa.progresso}/{ativa.alvo}
          </p>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-hud-foreground/20">
            <div className="h-full bg-moeda" style={{ width: `${(ativa.progresso / ativa.alvo) * 100}%` }} />
          </div>
        </div>
      )}

      {/* Barra de HP do boss */}
      {s.boss && (
        <div className="painel-hud absolute left-1/2 top-3 w-64 -translate-x-1/2 p-2">
          <p className="fonte-display text-center text-sm font-bold">{s.boss.nome}</p>
          <div className="mt-1 h-3 overflow-hidden rounded-full border-2 border-hud-border bg-hud-foreground/15">
            <div className="h-full bg-magia transition-[width]" style={{ width: `${(s.boss.hp / s.boss.max) * 100}%` }} />
          </div>
        </div>
      )}

      {/* Aviso de interação */}
      {s.prompt && !s.dialogo && (
        <div className="painel-hud pulso absolute bottom-40 left-1/2 -translate-x-1/2 px-4 py-2 text-sm font-bold sm:bottom-24">
          <span className="flex items-center gap-2">
            <MapPin className="size-4 text-moeda" />
            {s.prompt}
          </span>
        </div>
      )}

      {/* Notificações */}
      {s.toast && (
        <div className="painel-hud absolute bottom-56 left-1/2 -translate-x-1/2 px-4 py-2 text-sm font-bold sm:bottom-36">
          {s.toast}
        </div>
      )}
    </div>
  );
}
