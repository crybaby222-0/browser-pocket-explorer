/**
 * LITE - Multiplayer leve via canais em tempo real (Lovable Cloud).
 * Sem tabelas: usa presença + broadcast de posição em uma sala por mundo.
 */
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { AvatarConfig } from "./profile";
import type { RemotoInfo } from "./engine";

export interface EstadoLocal {
  x: number;
  y: number;
  z: number;
  ang: number;
  anim: string;
}

export class Multiplayer {
  private canal: RealtimeChannel | null = null;
  private id = Math.random().toString(36).slice(2, 10);
  private jogadores = new Map<string, RemotoInfo & { visto: number }>();
  private timer = 0;
  conectado = false;

  onJogadores: (lista: RemotoInfo[]) => void = () => {};
  onStatus: (s: "conectando" | "online" | "offline") => void = () => {};

  constructor(
    private sala: string,
    private nome: string,
    private avatar: AvatarConfig,
  ) {}

  async conectar() {
    this.onStatus("conectando");
    const canal = supabase.channel(`lite-mundo-${this.sala}`, {
      config: { broadcast: { self: false } },
    });
    this.canal = canal;

    canal.on("broadcast", { event: "pos" }, ({ payload }) => {
      const p = payload as RemotoInfo;
      if (!p?.id || p.id === this.id) return;
      this.jogadores.set(p.id, { ...p, visto: Date.now() });
      this.emitir();
    });
    canal.on("broadcast", { event: "sair" }, ({ payload }) => {
      this.jogadores.delete((payload as { id: string }).id);
      this.emitir();
    });

    await canal.subscribe((status) => {
      this.conectado = status === "SUBSCRIBED";
      this.onStatus(this.conectado ? "online" : "conectando");
    });

    this.timer = window.setInterval(() => this.limpar(), 4000);
  }

  /** Envia o estado do jogador local (chamar ~10x por segundo) */
  enviar(e: EstadoLocal) {
    if (!this.conectado || !this.canal) return;
    void this.canal.send({
      type: "broadcast",
      event: "pos",
      payload: { id: this.id, nome: this.nome, avatar: this.avatar, ...e },
    });
  }

  private limpar() {
    const agora = Date.now();
    let mudou = false;
    for (const [id, p] of this.jogadores) {
      if (agora - p.visto > 8000) {
        this.jogadores.delete(id);
        mudou = true;
      }
    }
    if (mudou) this.emitir();
  }

  private emitir() {
    this.onJogadores([...this.jogadores.values()]);
  }

  async desconectar() {
    if (this.canal) {
      void this.canal.send({ type: "broadcast", event: "sair", payload: { id: this.id } });
      await supabase.removeChannel(this.canal);
      this.canal = null;
    }
    clearInterval(this.timer);
    this.conectado = false;
    this.jogadores.clear();
    this.onStatus("offline");
  }
}
