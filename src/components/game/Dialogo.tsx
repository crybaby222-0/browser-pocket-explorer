/** Caixa de diálogo moderna com retrato, texto digitado e escolhas. */
import { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
import type { DialogoAtivo } from "@/game/engine";

export function Dialogo({ d, onEscolher }: { d: DialogoAtivo; onEscolher: (i: number) => void }) {
  const [visivel, setVisivel] = useState("");

  useEffect(() => {
    setVisivel("");
    let i = 0;
    const id = window.setInterval(() => {
      i++;
      setVisivel(d.texto.slice(0, i));
      if (i >= d.texto.length) window.clearInterval(id);
    }, 22);
    return () => window.clearInterval(id);
  }, [d.texto]);

  const completo = visivel.length >= d.texto.length;

  return (
    <div className="pointer-events-auto absolute inset-x-3 bottom-4 z-30 sm:inset-x-auto sm:left-1/2 sm:w-[560px] sm:-translate-x-1/2">
      <div className="painel-pop p-4" onClick={() => !completo && setVisivel(d.texto)}>
        <div className="flex items-start gap-3">
          {/* Retrato gerado a partir da cor do personagem */}
          <div
            className="grid size-14 shrink-0 place-items-center rounded-2xl border-2 border-hud-border"
            style={{ background: d.cor }}
          >
            <span className="fonte-display text-xl font-black text-hud-foreground">{d.npc.charAt(0)}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="fonte-display text-base font-bold leading-tight">
              {d.npc}
              <span className="ml-2 text-[11px] font-semibold uppercase tracking-wide opacity-70">{d.papel}</span>
            </p>
            <p className="mt-1 min-h-12 text-sm leading-relaxed">
              {visivel}
              {!completo && <span className="ml-0.5 animate-pulse">|</span>}
            </p>
          </div>
        </div>

        {completo && (
          <div className="mt-3 grid gap-2">
            {d.escolhas.map((e) => (
              <button
                key={e.idx}
                onClick={(ev) => {
                  ev.stopPropagation();
                  onEscolher(e.idx);
                }}
                className="flex items-center gap-2 rounded-xl border-2 border-hud-border bg-hud-foreground/10 px-3 py-2 text-left text-sm font-semibold transition hover:bg-hud-foreground/25 active:scale-[0.98]"
              >
                <MessageSquare className="size-4 shrink-0 text-moeda" />
                {e.texto}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
