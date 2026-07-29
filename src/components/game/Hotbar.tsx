/** Barra rápida estilo Minecraft (9 slots) sincronizada com a mochila. */
import { itemIcon } from "./icons";
import { ITENS } from "@/game/data";
import type { Slot } from "@/game/engine";

interface Props {
  slots: Slot[];
  sel: number;
  onSelecionar: (i: number) => void;
  onUsar: (i: number) => void;
}

export function Hotbar({ slots, sel, onSelecionar, onUsar }: Props) {
  return (
    <div className="pointer-events-auto absolute bottom-20 left-1/2 z-20 flex -translate-x-1/2 gap-1 rounded-xl border-2 border-hud-border bg-hud-foreground/10 p-1 backdrop-blur-md sm:bottom-16">
      {slots.slice(0, 9).map((s, i) => {
        const def = s.id ? ITENS[s.id] : null;
        const Icon = s.id ? itemIcon(s.id) : null;
        return (
          <button
            key={i}
            aria-label={def ? def.nome : `Slot ${i + 1}`}
            onClick={() => (sel === i && s.id ? onUsar(i) : onSelecionar(i))}
            className={`relative grid size-10 place-items-center rounded-lg border-2 sm:size-11 ${
              sel === i ? "border-hud-foreground bg-hud-foreground/30" : "border-hud-border bg-hud-foreground/10"
            }`}
          >
            {Icon && <Icon className="size-5" style={{ color: def?.cor }} />}
            {s.qtd > 1 && (
              <span className="absolute bottom-0 right-0.5 text-[10px] font-black">{s.qtd}</span>
            )}
            <span className="absolute left-0.5 top-0 text-[9px] font-bold opacity-60">{i + 1}</span>
          </button>
        );
      })}
    </div>
  );
}
