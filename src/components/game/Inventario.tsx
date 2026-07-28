/** Inventário com arrastar e soltar, descrição e bancada de criação. */
import { useState } from "react";
import { Hammer, Package, X } from "lucide-react";
import { ITENS, RECEITAS } from "@/game/data";
import type { Slot } from "@/game/engine";
import { iconFor } from "./icons";

interface Props {
  slots: Slot[];
  equipado: { arma: string | null; ferramenta: string | null };
  moedas: number;
  podeCriar: (id: string) => boolean;
  onUsar: (i: number) => void;
  onMover: (de: number, para: number) => void;
  onCriar: (id: string) => void;
  onFechar: () => void;
}

export function Inventario({ slots, equipado, moedas, podeCriar, onUsar, onMover, onCriar, onFechar }: Props) {
  const [aba, setAba] = useState<"itens" | "criar">("itens");
  const [sel, setSel] = useState<number | null>(null);
  const [arrasto, setArrasto] = useState<number | null>(null);
  const item = sel != null && slots[sel]?.id ? ITENS[slots[sel].id] : null;

  return (
    <div className="pointer-events-auto absolute inset-0 z-40 grid place-items-center bg-foreground/40 p-3 backdrop-blur-sm">
      <div className="painel-pop w-full max-w-3xl p-4">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="fonte-display flex items-center gap-2 text-lg font-bold">
            <Package className="size-5 text-moeda" /> Mochila
          </h2>
          <div className="ml-auto flex gap-1 rounded-xl border-2 border-hud-border p-1">
            {(["itens", "criar"] as const).map((a) => (
              <button
                key={a}
                onClick={() => setAba(a)}
                className={`rounded-lg px-3 py-1 text-xs font-bold uppercase tracking-wide transition ${
                  aba === a ? "bg-hud-foreground/30" : "opacity-70 hover:opacity-100"
                }`}
              >
                {a === "itens" ? "Itens" : "Criar"}
              </button>
            ))}
          </div>
          <button aria-label="Fechar" onClick={onFechar} className="rounded-lg border-2 border-hud-border p-1.5">
            <X className="size-4" />
          </button>
        </div>

        {aba === "itens" ? (
          <div className="grid gap-4 sm:grid-cols-[1fr_240px]">
            <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
              {slots.map((s, i) => {
                const def = s.id ? ITENS[s.id] : null;
                const Icon = def ? iconFor(def.icone) : null;
                const eq = def && (equipado.arma === s.id || equipado.ferramenta === s.id);
                return (
                  <button
                    key={i}
                    draggable={!!s.id}
                    onDragStart={() => setArrasto(i)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (arrasto != null) onMover(arrasto, i);
                      setArrasto(null);
                    }}
                    onClick={() => setSel(i)}
                    onDoubleClick={() => onUsar(i)}
                    className={`relative grid aspect-square place-items-center rounded-xl border-2 transition ${
                      sel === i ? "border-moeda bg-hud-foreground/25" : "border-hud-border bg-hud-foreground/10"
                    } ${eq ? "ring-2 ring-energia" : ""}`}
                    title={def?.nome}
                  >
                    {Icon && <Icon className="size-6" />}
                    {s.qtd > 1 && (
                      <span className="absolute bottom-0.5 right-1 text-[10px] font-black tabular-nums">{s.qtd}</span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="rounded-2xl border-2 border-hud-border bg-hud-foreground/10 p-3">
              {item ? (
                <>
                  <p className="fonte-display text-base font-bold">{item.nome}</p>
                  <p className="text-[11px] font-bold uppercase tracking-wide opacity-70">{item.kind}</p>
                  <p className="mt-2 text-sm leading-relaxed opacity-90">{item.desc}</p>
                  {item.dano ? <p className="mt-1 text-xs font-bold">Dano: {item.dano}</p> : null}
                  {item.cura ? <p className="mt-1 text-xs font-bold">Cura: {item.cura}</p> : null}
                  <button
                    onClick={() => sel != null && onUsar(sel)}
                    className="mt-3 w-full rounded-xl border-2 border-hud-border px-3 py-2 text-sm font-bold transition hover:bg-hud-foreground/25 active:scale-95"
                  >
                    {item.kind === "consumivel" ? "Usar" : "Equipar / Guardar"}
                  </button>
                </>
              ) : (
                <p className="text-sm opacity-70">
                  Selecione um item para ver a descrição. Arraste para reorganizar, toque duas vezes para usar.
                </p>
              )}
              <p className="mt-3 border-t-2 border-hud-border pt-2 text-xs font-bold">Moedas: {moedas}</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {RECEITAS.map((r) => {
              const res = ITENS[r.resultado];
              const Icon = iconFor(res.icone);
              const ok = podeCriar(r.id);
              return (
                <div key={r.id} className="flex items-center gap-3 rounded-xl border-2 border-hud-border bg-hud-foreground/10 p-2.5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg border-2 border-hud-border">
                    <Icon className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold">{res.nome}</p>
                    <p className="truncate text-[11px] opacity-80">
                      {r.ingredientes.map((i) => `${ITENS[i.id].nome} x${i.qtd}`).join(" + ")}
                    </p>
                  </div>
                  <button
                    disabled={!ok}
                    onClick={() => onCriar(r.id)}
                    className="flex items-center gap-1 rounded-lg border-2 border-hud-border px-2.5 py-1.5 text-xs font-bold transition enabled:hover:bg-hud-foreground/25 enabled:active:scale-95 disabled:opacity-40"
                  >
                    <Hammer className="size-3.5" /> Criar
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
