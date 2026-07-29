/**
 * LITE - Persistência automática em IndexedDB.
 */
export interface SaveData {
  version: number;
  player: { x: number; y: number; z: number; hp: number; maxHp: number; stamina: number };
  coins: number;
  items: Record<string, number>;
  equipped: { arma: string | null; ferramenta: string | null };
  quests: Record<string, { estado: "ativa" | "concluida"; progresso: number }>;
  flags: Record<string, boolean>;
  settings: Settings;
  tempo: number;
  jogadoEm: number;
}

export interface Settings {
  volumeMaster: number;
  volumeMusica: number;
  volumeEfeitos: number;
  qualidade: "baixa" | "media" | "alta";
  idioma: "pt" | "en";
  sensibilidade: number;
  mostrarFps: boolean;
  sombras: boolean;
  distancia: number;
  inverterY: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  volumeMaster: 0.7,
  volumeMusica: 0.45,
  volumeEfeitos: 0.8,
  qualidade: "media",
  idioma: "pt",
  sensibilidade: 1,
  mostrarFps: false,
  sombras: true,
  distancia: 120,
  inverterY: false,
};

const DB_NAME = "lite-open-world";
const STORE = "saves";
let KEY = "slot-1";
/** Define qual mundo/slot está em uso (um save por mundo criado) */
export function setSaveSlot(id: string) {
  KEY = `slot-${id}`;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveGame(data: SaveData): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(data, KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // Fallback silencioso quando IndexedDB não está disponível (modo privado)
    try {
      localStorage.setItem(`lite-save-${KEY}`, JSON.stringify(data));
    } catch {
      /* sem persistência */
    }
  }
}

export async function loadGame(): Promise<SaveData | null> {
  try {
    const db = await openDB();
    const data = await new Promise<SaveData | null>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(KEY);
      req.onsuccess = () => resolve((req.result as SaveData) ?? null);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return data;
  } catch {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(`lite-save-${KEY}`) : null;
    return raw ? (JSON.parse(raw) as SaveData) : null;
  }
}

export async function clearSave(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(KEY);
    db.close();
  } catch {
    /* ignore */
  }
  try {
    localStorage.removeItem(`lite-save-${KEY}`);
  } catch {
    /* ignore */
  }
}
