/** Menu inicial do LITE: perfil, editor de avatar, mundos, aparência e multiplayer. */
import { useEffect, useState } from "react";
import { Gamepad2, Globe2, Palette, Play, Sparkles, Trash2, UserRound, Users, Smartphone } from "lucide-react";
import { Link } from "@tanstack/react-router";
import {
  APARENCIA_PADRAO,
  type Aparencia,
  type AvatarConfig,
  ESTILOS_CABELO,
  type MundoConfig,
  type Perfil,
  PERFIL_PADRAO,
  carregarAparencia,
  carregarMundos,
  carregarPerfil,
  novoMundo,
  salvarAparencia,
  salvarMundos,
  salvarPerfil,
} from "@/game/profile";
import { AvatarPreview } from "./AvatarPreview";

export interface Inicio {
  perfil: Perfil;
  aparencia: Aparencia;
  mundo: MundoConfig;
  multiplayer: boolean;
  joystick: "vertical" | "horizontal";
}

type Aba = "jogar" | "perfil" | "mundos" | "visual" | "online";

const PELES = ["#ffd7b0", "#f2c096", "#d9a06a", "#a9713e", "#6f4a26", "#ffe9d6"];
const CORES = ["#ff5f7e", "#ffb703", "#4b7bec", "#4aa83c", "#c780ff", "#00c2c7", "#ff8a5b", "#2a2140"];

function Swatches({ valor, onPick, cores }: { valor: string; onPick: (c: string) => void; cores: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {cores.map((c) => (
        <button
          key={c}
          onClick={() => onPick(c)}
          aria-label={`Cor ${c}`}
          style={{ background: c }}
          className={`size-8 rounded-lg border-2 ${valor === c ? "border-hud-foreground scale-110" : "border-hud-border"} transition-transform`}
        />
      ))}
    </div>
  );
}

function Linha({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-bold opacity-85">{label}</span>
      {children}
    </label>
  );
}

export function MenuInicial({ onJogar }: { onJogar: (i: Inicio) => void }) {
  const [aba, setAba] = useState<Aba>("jogar");
  const [perfil, setPerfil] = useState<Perfil>(PERFIL_PADRAO);
  const [aparencia, setAparencia] = useState<Aparencia>(APARENCIA_PADRAO);
  const [mundos, setMundos] = useState<MundoConfig[]>([]);
  const [sel, setSel] = useState(0);
  const [multi, setMulti] = useState(false);
  const [joystick, setJoystick] = useState<"vertical" | "horizontal">("vertical");
  const [novoNome, setNovoNome] = useState("");
  const [novaSeed, setNovaSeed] = useState("");

  useEffect(() => {
    void (async () => {
      setPerfil(await carregarPerfil());
      setAparencia(await carregarAparencia());
      setMundos(await carregarMundos());
    })();
  }, []);

  const mundo = mundos[sel] ?? mundos[0];
  const avatar = perfil.avatar;
  const setAvatar = (p: Partial<AvatarConfig>) => setPerfil((v) => ({ ...v, avatar: { ...v.avatar, ...p } }));
  const setMundo = (p: Partial<MundoConfig>) =>
    setMundos((lista) => lista.map((m, i) => (i === sel ? { ...m, ...p } : m)));

  const jogar = () => {
    void salvarPerfil(perfil);
    void salvarAparencia(aparencia);
    void salvarMundos(mundos);
    onJogar({ perfil, aparencia, mundo: mundo!, multiplayer: multi, joystick });
  };

  const abas: [Aba, string, React.ReactNode][] = [
    ["jogar", "Jogar", <Play key="a" className="size-4" />],
    ["perfil", "Avatar", <UserRound key="b" className="size-4" />],
    ["mundos", "Mundos", <Globe2 key="c" className="size-4" />],
    ["visual", "Visual", <Palette key="d" className="size-4" />],
    ["online", "Online", <Users key="e" className="size-4" />],
  ];

  return (
    <div className="absolute inset-0 z-50 overflow-y-auto bg-gradient-to-b from-primary/25 via-background to-accent/25 p-4">
      <div className="mx-auto flex max-w-3xl flex-col gap-4 py-4">
        <header className="text-center">
          <h1 className="fonte-display text-5xl font-black tracking-tight">LITE</h1>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] opacity-70">Mundo aberto portátil</p>
        </header>

        <nav className="flex flex-wrap justify-center gap-2">
          {abas.map(([id, label, icon]) => (
            <button
              key={id}
              onClick={() => setAba(id)}
              className={`flex items-center gap-2 rounded-xl border-2 border-hud-border px-3 py-2 text-sm font-bold active:scale-95 ${
                aba === id ? "bg-hud-foreground/25" : "bg-hud-foreground/10"
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </nav>

        <div className="painel-pop p-4">
          {aba === "jogar" && (
            <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
              <div className="space-y-2 text-sm">
                <p className="text-base font-bold">Olá, {perfil.nome}!</p>
                <p className="opacity-85">
                  Mundo selecionado: <strong>{mundo?.nome}</strong> (semente {mundo?.seed})
                </p>
                <p className="opacity-85">
                  Explore florestas, vilas, lagos, montanhas, cavernas, ruínas e praias. Faça missões, crie itens e
                  enfrente o Rei Geleia.
                </p>
                <p className="text-[11px] opacity-70">
                  Desktop: WASD, mouse e gamepad. Celular: joystick, botões e barra rápida.
                </p>
                <Linha label="Layout do joystick">
                  <div className="flex gap-2">
                    {(["vertical", "horizontal"] as const).map((v) => (
                      <button
                        key={v}
                        onClick={() => setJoystick(v)}
                        className={`flex-1 rounded-lg border-2 border-hud-border px-3 py-2 text-xs font-bold ${
                          joystick === v ? "bg-hud-foreground/25" : "bg-hud-foreground/10"
                        }`}
                      >
                        {v === "vertical" ? "Clássico (canto)" : "Horizontal (paisagem)"}
                      </button>
                    ))}
                  </div>
                </Linha>
                <button
                  onClick={jogar}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-hud-border bg-hud-foreground/20 px-4 py-3 text-lg font-bold active:scale-95"
                >
                  <Gamepad2 className="size-5" /> Começar aventura
                </button>
                <Link
                  to="/apk"
                  className="flex items-center justify-center gap-2 rounded-xl border-2 border-hud-border bg-hud-foreground/10 px-4 py-2 text-sm font-bold"
                >
                  <Smartphone className="size-4" /> Como gerar o APK
                </Link>
              </div>
              <AvatarPreview avatar={avatar} className="h-56 w-full min-w-40 rounded-xl bg-hud-foreground/10 sm:w-48" />
            </div>
          )}

          {aba === "perfil" && (
            <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
              <AvatarPreview avatar={avatar} className="h-64 w-full rounded-xl bg-hud-foreground/10 sm:w-52" />
              <div className="space-y-3">
                <Linha label="Nome do jogador">
                  <input
                    value={perfil.nome}
                    maxLength={16}
                    onChange={(e) => setPerfil((p) => ({ ...p, nome: e.target.value }))}
                    className="w-full rounded-lg border-2 border-hud-border bg-hud-foreground/10 px-3 py-2"
                  />
                </Linha>
                <Linha label="Tom de pele">
                  <Swatches valor={avatar.pele} cores={PELES} onPick={(pele) => setAvatar({ pele })} />
                </Linha>
                <Linha label="Estilo de cabelo">
                  <div className="flex flex-wrap gap-2">
                    {ESTILOS_CABELO.map((h) => (
                      <button
                        key={h}
                        onClick={() => setAvatar({ cabelo: h })}
                        className={`rounded-lg border-2 border-hud-border px-3 py-1.5 text-xs font-bold capitalize ${
                          avatar.cabelo === h ? "bg-hud-foreground/25" : "bg-hud-foreground/10"
                        }`}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                </Linha>
                <Linha label="Cor do cabelo">
                  <Swatches
                    valor={avatar.corCabelo}
                    cores={["#5b3a29", "#2a2140", "#ffb703", "#ff5f7e", "#c780ff", "#f6f3ea"]}
                    onPick={(corCabelo) => setAvatar({ corCabelo })}
                  />
                </Linha>
                <Linha label="Camisa">
                  <Swatches valor={avatar.camisa} cores={CORES} onPick={(camisa) => setAvatar({ camisa })} />
                </Linha>
                <Linha label="Calça">
                  <Swatches valor={avatar.calca} cores={CORES} onPick={(calca) => setAvatar({ calca })} />
                </Linha>
                <Linha label={`Altura (${avatar.altura.toFixed(2)}x)`}>
                  <input
                    type="range"
                    min={0.8}
                    max={1.25}
                    step={0.01}
                    value={avatar.altura}
                    onChange={(e) => setAvatar({ altura: Number(e.target.value) })}
                    className="w-full"
                  />
                </Linha>
                <div className="flex gap-4 text-sm font-bold">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={avatar.chapeu} onChange={(e) => setAvatar({ chapeu: e.target.checked })} />
                    Chapéu
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={avatar.oculos} onChange={(e) => setAvatar({ oculos: e.target.checked })} />
                    Óculos
                  </label>
                </div>
              </div>
            </div>
          )}

          {aba === "mundos" && mundo && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {mundos.map((m, i) => (
                  <button
                    key={m.id}
                    onClick={() => setSel(i)}
                    className={`rounded-lg border-2 border-hud-border px-3 py-1.5 text-sm font-bold ${
                      i === sel ? "bg-hud-foreground/25" : "bg-hud-foreground/10"
                    }`}
                  >
                    {m.nome}
                  </button>
                ))}
              </div>

              <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                <input
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  placeholder="Nome do novo mundo"
                  className="rounded-lg border-2 border-hud-border bg-hud-foreground/10 px-3 py-2 text-sm"
                />
                <input
                  value={novaSeed}
                  onChange={(e) => setNovaSeed(e.target.value)}
                  placeholder="Semente (texto ou número)"
                  className="rounded-lg border-2 border-hud-border bg-hud-foreground/10 px-3 py-2 text-sm"
                />
                <button
                  onClick={() => {
                    const m = novoMundo(novoNome, novaSeed);
                    setMundos((l) => [...l, m]);
                    setSel(mundos.length);
                    setNovoNome("");
                    setNovaSeed("");
                  }}
                  className="flex items-center justify-center gap-2 rounded-lg border-2 border-hud-border bg-hud-foreground/20 px-3 py-2 text-sm font-bold active:scale-95"
                >
                  <Sparkles className="size-4" /> Criar
                </button>
              </div>

              <Linha label={`Semente: ${mundo.seed}`}>
                <input
                  type="number"
                  value={mundo.seed}
                  onChange={(e) => setMundo({ seed: Math.max(1, Number(e.target.value) || 1) })}
                  className="w-full rounded-lg border-2 border-hud-border bg-hud-foreground/10 px-3 py-2 text-sm"
                />
              </Linha>
              <Linha label={`Montanhas (${mundo.montanhas.toFixed(2)}x)`}>
                <input type="range" min={0.2} max={2} step={0.05} value={mundo.montanhas}
                  onChange={(e) => setMundo({ montanhas: Number(e.target.value) })} className="w-full" />
              </Linha>
              <Linha label={`Vegetação (${mundo.floresta.toFixed(2)}x)`}>
                <input type="range" min={0.2} max={2} step={0.05} value={mundo.floresta}
                  onChange={(e) => setMundo({ floresta: Number(e.target.value) })} className="w-full" />
              </Linha>
              <Linha label={`Nível da água (${mundo.agua.toFixed(1)})`}>
                <input type="range" min={-4} max={6} step={0.5} value={mundo.agua}
                  onChange={(e) => setMundo({ agua: Number(e.target.value) })} className="w-full" />
              </Linha>
              <Linha label={`Hora inicial (${String(mundo.hora).padStart(2, "0")}:00)`}>
                <input type="range" min={0} max={23} step={1} value={mundo.hora}
                  onChange={(e) => setMundo({ hora: Number(e.target.value) })} className="w-full" />
              </Linha>
              {mundos.length > 1 && (
                <button
                  onClick={() => {
                    setMundos((l) => l.filter((_, i) => i !== sel));
                    setSel(0);
                  }}
                  className="flex items-center gap-2 rounded-lg border-2 border-hud-border bg-destructive/20 px-3 py-2 text-sm font-bold"
                >
                  <Trash2 className="size-4" /> Excluir mundo
                </button>
              )}
              <p className="text-[11px] opacity-70">Cada mundo tem seu próprio save automático.</p>
            </div>
          )}

          {aba === "visual" && (
            <div className="space-y-3">
              <Linha label="Pacote de textura">
                <div className="flex flex-wrap gap-2">
                  {(["liso", "pixel", "aquarela", "cel"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setAparencia((a) => ({ ...a, textura: t }))}
                      className={`rounded-lg border-2 border-hud-border px-3 py-1.5 text-sm font-bold capitalize ${
                        aparencia.textura === t ? "bg-hud-foreground/25" : "bg-hud-foreground/10"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </Linha>
              <Linha label={`Saturação / brilho (${aparencia.saturacao.toFixed(2)})`}>
                <input type="range" min={0.4} max={1.6} step={0.05} value={aparencia.saturacao}
                  onChange={(e) => setAparencia((a) => ({ ...a, saturacao: Number(e.target.value) }))} className="w-full" />
              </Linha>
              <div className="flex flex-wrap gap-4 text-sm font-bold">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={aparencia.nevoa}
                    onChange={(e) => setAparencia((a) => ({ ...a, nevoa: e.target.checked }))} />
                  Névoa atmosférica
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={aparencia.retro}
                    onChange={(e) => setAparencia((a) => ({ ...a, retro: e.target.checked }))} />
                  Shader retrô (baixa resolução)
                </label>
              </div>
            </div>
          )}

          {aba === "online" && (
            <div className="space-y-3 text-sm">
              <label className="flex items-center gap-2 font-bold">
                <input type="checkbox" checked={multi} onChange={(e) => setMulti(e.target.checked)} />
                Ativar modo multiplayer
              </label>
              <p className="opacity-85">
                Jogadores no mesmo mundo (mesma semente e nome) se encontram na mesma sala e aparecem no mapa em tempo
                real. Compartilhe o nome e a semente do mundo com seus amigos.
              </p>
              <p className="opacity-75">
                Sala atual: <strong>{mundo?.nome} #{mundo?.seed}</strong>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
