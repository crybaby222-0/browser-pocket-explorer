/**
 * LITE - Perfil do jogador, avatar, mundos personalizados e aparência.
 * Tudo persiste em IndexedDB (com fallback para localStorage).
 */

export interface AvatarConfig {
  pele: string;
  cabelo: string;
  corCabelo: string;
  camisa: string;
  calca: string;
  chapeu: boolean;
  oculos: boolean;
  altura: number;
}

export interface Perfil {
  nome: string;
  cor: string;
  avatar: AvatarConfig;
  stats: { tempo: number; mortes: number; criados: number; partidas: number };
}

export interface MundoConfig {
  id: string;
  nome: string;
  seed: number;
  montanhas: number;
  floresta: number;
  agua: number;
  hora: number;
  clima: "ensolarado" | "nublado" | "poente" | "noite";
  criadoEm: number;
}

export interface Aparencia {
  textura: "liso" | "pixel" | "aquarela" | "cel";
  contorno: boolean;
  nevoa: boolean;
  saturacao: number;
  retro: boolean;
}

export const AVATAR_PADRAO: AvatarConfig = {
  pele: "#ffd7b0",
  cabelo: "curto",
  corCabelo: "#5b3a29",
  camisa: "#ff5f7e",
  calca: "#4b7bec",
  chapeu: false,
  oculos: false,
  altura: 1,
};

export const PERFIL_PADRAO: Perfil = {
  nome: "Viajante",
  cor: "#ff5f7e",
  avatar: { ...AVATAR_PADRAO },
  stats: { tempo: 0, mortes: 0, criados: 0, partidas: 0 },
};

export const APARENCIA_PADRAO: Aparencia = {
  textura: "liso",
  contorno: true,
  nevoa: true,
  saturacao: 1,
  retro: false,
};

export const MUNDO_PADRAO: MundoConfig = {
  id: "petala",
  nome: "Vale de Pétala",
  seed: 1337,
  montanhas: 1,
  floresta: 1,
  agua: 0,
  hora: 8,
  clima: "ensolarado",
  criadoEm: 0,
};

export const ESTILOS_CABELO = ["curto", "longo", "topete", "coque", "careca"] as const;

/* ------------------------- Persistência ------------------------- */

const DB = "lite-meta";
const STORE = "kv";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function kvGet<T>(key: string): Promise<T | null> {
  try {
    const db = await open();
    const v = await new Promise<T | null>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const r = tx.objectStore(STORE).get(key);
      r.onsuccess = () => resolve((r.result as T) ?? null);
      r.onerror = () => reject(r.error);
    });
    db.close();
    return v;
  } catch {
    try {
      const raw = localStorage.getItem(`lite-${key}`);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }
}

export async function kvSet<T>(key: string, value: T): Promise<void> {
  try {
    const db = await open();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    try {
      localStorage.setItem(`lite-${key}`, JSON.stringify(value));
    } catch {
      /* sem persistência */
    }
  }
}

export const carregarPerfil = async (): Promise<Perfil> => ({
  ...PERFIL_PADRAO,
  ...((await kvGet<Perfil>("perfil")) ?? {}),
});
export const salvarPerfil = (p: Perfil) => kvSet("perfil", p);

export const carregarAparencia = async (): Promise<Aparencia> => ({
  ...APARENCIA_PADRAO,
  ...((await kvGet<Aparencia>("aparencia")) ?? {}),
});
export const salvarAparencia = (a: Aparencia) => kvSet("aparencia", a);

export async function carregarMundos(): Promise<MundoConfig[]> {
  const lista = (await kvGet<MundoConfig[]>("mundos")) ?? [];
  return lista.length ? lista : [{ ...MUNDO_PADRAO }];
}
export const salvarMundos = (m: MundoConfig[]) => kvSet("mundos", m);

export function novoMundo(nome: string, seedTexto: string): MundoConfig {
  let seed = Number(seedTexto);
  if (!seedTexto.trim() || Number.isNaN(seed)) {
    seed = 0;
    for (let i = 0; i < seedTexto.length; i++) seed = (seed * 31 + seedTexto.charCodeAt(i)) % 1e9;
    if (!seed) seed = Math.floor(Math.random() * 1e9);
  }
  return {
    id: `m${Date.now().toString(36)}`,
    nome: nome.trim() || "Novo mundo",
    seed: Math.floor(Math.abs(seed)) || 1,
    montanhas: 1,
    floresta: 1,
    agua: 0,
    hora: 8,
    clima: "ensolarado",
    criadoEm: Date.now(),
  };
}
