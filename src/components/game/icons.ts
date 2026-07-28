/**
 * Mapeamento de ícones (Lucide) usados pela interface do LITE.
 * Nunca usamos emojis - apenas SVGs reais da biblioteca.
 */
import {
  Apple,
  Axe,
  CakeSlice,
  Crosshair,
  Droplet,
  FlaskConical,
  Flower2,
  Gem,
  Lightbulb,
  Mountain,
  Package,
  Pickaxe,
  Shell,
  Sword,
  Swords,
  TreePine,
  Wand2,
  type LucideIcon,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  Apple,
  Axe,
  CakeSlice,
  Crosshair,
  Droplet,
  FlaskConical,
  Flower2,
  Gem,
  Lantern: Lightbulb,
  Mountain,
  Pickaxe,
  Shell,
  Sword,
  Swords,
  TreePine,
  Wand2,
};

export function iconFor(name: string): LucideIcon {
  return MAP[name] ?? Package;
}
