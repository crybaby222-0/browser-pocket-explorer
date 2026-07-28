/**
 * LITE - Dados de conteúdo: itens, receitas, NPCs, diálogos e missões.
 * Estruturado para expansão simples (novos itens/missões = novas entradas).
 */

export type ItemKind = "consumivel" | "equipamento" | "ferramenta" | "material" | "chave";

export interface ItemDef {
  id: string;
  nome: string;
  kind: ItemKind;
  icone: string; // nome do ícone Lucide usado na UI
  desc: string;
  valor: number;
  cura?: number;
  energia?: number;
  dano?: number;
  empilhavel: boolean;
}

export const ITENS: Record<string, ItemDef> = {
  maca: { id: "maca", nome: "Maçã Doce", kind: "consumivel", icone: "Apple", desc: "Colhida no pomar da vila. Restaura 25 de vida.", valor: 8, cura: 25, empilhavel: true },
  bolo: { id: "bolo", nome: "Bolo de Mel", kind: "consumivel", icone: "CakeSlice", desc: "Feito na cozinha da Nina. Restaura vida e energia.", valor: 30, cura: 50, energia: 60, empilhavel: true },
  pocao: { id: "pocao", nome: "Poção Cintilante", kind: "consumivel", icone: "FlaskConical", desc: "Brilha no escuro. Restaura toda a vida.", valor: 60, cura: 999, empilhavel: true },
  espada: { id: "espada", nome: "Espada de Pétala", kind: "equipamento", icone: "Sword", desc: "Leve e afiada. Dano 18.", valor: 120, dano: 18, empilhavel: false },
  espada_lua: { id: "espada_lua", nome: "Lâmina da Lua", kind: "equipamento", icone: "Swords", desc: "Forjada com cristal da caverna. Dano 34.", valor: 400, dano: 34, empilhavel: false },
  arco: { id: "arco", nome: "Arco de Bambu", kind: "equipamento", icone: "Crosshair", desc: "Dispara flechas de luz. Dano 14 à distância.", valor: 150, dano: 14, empilhavel: false },
  cajado: { id: "cajado", nome: "Cajado Estelar", kind: "equipamento", icone: "Wand2", desc: "Conjura magia de estrelas. Dano 26 em área.", valor: 320, dano: 26, empilhavel: false },
  machado: { id: "machado", nome: "Machado Simples", kind: "ferramenta", icone: "Axe", desc: "Corta madeira das florestas.", valor: 45, empilhavel: false },
  picareta: { id: "picareta", nome: "Picareta", kind: "ferramenta", icone: "Pickaxe", desc: "Quebra pedras e minérios da caverna.", valor: 60, empilhavel: false },
  madeira: { id: "madeira", nome: "Madeira", kind: "material", icone: "TreePine", desc: "Material básico de construção.", valor: 4, empilhavel: true },
  pedra: { id: "pedra", nome: "Pedra", kind: "material", icone: "Mountain", desc: "Resistente e comum nas trilhas.", valor: 3, empilhavel: true },
  cristal: { id: "cristal", nome: "Cristal Cintilante", kind: "material", icone: "Gem", desc: "Pulsa com luz azul. Vem da caverna.", valor: 40, empilhavel: true },
  flor: { id: "flor", nome: "Flor Solar", kind: "material", icone: "Flower2", desc: "Cresce nos campos floridos.", valor: 6, empilhavel: true },
  concha: { id: "concha", nome: "Concha Espiral", kind: "material", icone: "Shell", desc: "Encontrada na Praia Coral.", valor: 12, empilhavel: true },
  mel: { id: "mel", nome: "Pote de Mel", kind: "material", icone: "Droplet", desc: "Doce e pegajoso.", valor: 10, empilhavel: true },
  lanterna: { id: "lanterna", nome: "Lanterna Perdida", kind: "chave", icone: "Lantern", desc: "Uma das três lanternas do farol antigo.", valor: 0, empilhavel: true },
};

export interface Receita {
  id: string;
  resultado: string;
  qtd: number;
  ingredientes: { id: string; qtd: number }[];
  categoria: "ferramenta" | "comida" | "especial";
}

export const RECEITAS: Receita[] = [
  { id: "r_machado", resultado: "machado", qtd: 1, categoria: "ferramenta", ingredientes: [{ id: "madeira", qtd: 3 }, { id: "pedra", qtd: 2 }] },
  { id: "r_picareta", resultado: "picareta", qtd: 1, categoria: "ferramenta", ingredientes: [{ id: "madeira", qtd: 2 }, { id: "pedra", qtd: 4 }] },
  { id: "r_arco", resultado: "arco", qtd: 1, categoria: "ferramenta", ingredientes: [{ id: "madeira", qtd: 5 }, { id: "flor", qtd: 2 }] },
  { id: "r_bolo", resultado: "bolo", qtd: 1, categoria: "comida", ingredientes: [{ id: "mel", qtd: 2 }, { id: "maca", qtd: 2 }] },
  { id: "r_pocao", resultado: "pocao", qtd: 1, categoria: "comida", ingredientes: [{ id: "cristal", qtd: 1 }, { id: "flor", qtd: 3 }] },
  { id: "r_espada_lua", resultado: "espada_lua", qtd: 1, categoria: "especial", ingredientes: [{ id: "cristal", qtd: 3 }, { id: "pedra", qtd: 5 }, { id: "madeira", qtd: 2 }] },
  { id: "r_cajado", resultado: "cajado", qtd: 1, categoria: "especial", ingredientes: [{ id: "cristal", qtd: 2 }, { id: "concha", qtd: 3 }, { id: "madeira", qtd: 3 }] },
];

export type NpcRotina = "caminhar" | "trabalhar" | "sentar" | "dormir";

export interface NpcDef {
  id: string;
  nome: string;
  cor: { shirt: string; pants: string; hair: string; skin: string; hat?: boolean };
  home: [number, number];
  rota: [number, number][];
  rotina: NpcRotina;
  papel: string;
  falas: DialogoNo[];
  quest?: string;
}

export interface Escolha {
  texto: string;
  proximo?: string;
  evento?: "aceitar_quest" | "entregar_quest" | "fechar" | "presente";
}

export interface DialogoNo {
  id: string;
  texto: string;
  escolhas?: Escolha[];
}

export const NPCS: NpcDef[] = [
  {
    id: "nina",
    nome: "Nina",
    papel: "Padeira da Vila",
    cor: { shirt: "#ff8fb1", pants: "#8a5fd6", hair: "#3d2b56", skin: "#ffd7b0" },
    home: [4, -14],
    rota: [[4, -14], [10, -18], [2, -24], [-4, -16]],
    rotina: "trabalhar",
    quest: "q_mel",
    falas: [
      { id: "start", texto: "Ah, você acordou! O cheiro do meu bolo de mel acorda qualquer um.", escolhas: [{ texto: "Precisa de ajuda?", proximo: "quest" }, { texto: "Só passando.", evento: "fechar" }] },
      { id: "quest", texto: "As abelhas do campo florido guardaram meu mel. Traz 3 potes pra mim?", escolhas: [{ texto: "Deixa comigo!", evento: "aceitar_quest" }, { texto: "Agora não.", evento: "fechar" }] },
      { id: "entrega", texto: "Você conseguiu! Aqui, leve este bolo e umas moedas. Volte sempre.", escolhas: [{ texto: "Obrigado!", evento: "entregar_quest" }] },
      { id: "andamento", texto: "Ainda faltam potes de mel. Procure nos campos a oeste da vila.", escolhas: [{ texto: "Estou indo.", evento: "fechar" }] },
      { id: "fim", texto: "O forno está quentinho hoje. Fique à vontade na vila!", escolhas: [{ texto: "Até mais.", evento: "fechar" }] },
    ],
  },
  {
    id: "tobi",
    nome: "Tobi",
    papel: "Guarda do Portão",
    cor: { shirt: "#5aa9e6", pants: "#2b4570", hair: "#8a5a37", skin: "#e8b98a", hat: true },
    home: [-12, -8],
    rota: [[-12, -8], [-18, -2], [-12, 4], [-6, -2]],
    rotina: "caminhar",
    quest: "q_slime",
    falas: [
      { id: "start", texto: "Fique atento. Geleias saltitantes apareceram nas trilhas do lago.", escolhas: [{ texto: "Eu cuido delas.", proximo: "quest" }, { texto: "Tomarei cuidado.", evento: "fechar" }] },
      { id: "quest", texto: "Derrote 5 geleias e a vila dorme tranquila. Aceita?", escolhas: [{ texto: "Aceito.", evento: "aceitar_quest" }, { texto: "Ainda não.", evento: "fechar" }] },
      { id: "entrega", texto: "Cinco geleias! Você é mais forte do que aparenta. Pegue esta lâmina.", escolhas: [{ texto: "Valeu!", evento: "entregar_quest" }] },
      { id: "andamento", texto: "Continue caçando as geleias perto do Lago Espelho.", escolhas: [{ texto: "Certo.", evento: "fechar" }] },
      { id: "fim", texto: "As trilhas estão seguras graças a você.", escolhas: [{ texto: "Até logo.", evento: "fechar" }] },
    ],
  },
  {
    id: "mestre_sol",
    nome: "Mestre Sol",
    papel: "Guardião das Ruínas",
    cor: { shirt: "#ffd166", pants: "#c9742e", hair: "#f4f1de", skin: "#c98b5f", hat: true },
    home: [-80, -72],
    rota: [[-80, -72], [-74, -78], [-84, -84]],
    rotina: "sentar",
    quest: "q_lanternas",
    falas: [
      { id: "start", texto: "As três lanternas do farol se perderam pelo mundo. Sem elas, a noite não termina.", escolhas: [{ texto: "Onde procuro?", proximo: "quest" }, { texto: "Volto depois.", evento: "fechar" }] },
      { id: "quest", texto: "Uma na caverna, uma na praia, uma no topo do Monte Aurora. Traga-as.", escolhas: [{ texto: "Vou encontrá-las.", evento: "aceitar_quest" }, { texto: "É perigoso demais.", evento: "fechar" }] },
      { id: "entrega", texto: "As três luzes voltaram! O amanhecer é seu, viajante.", escolhas: [{ texto: "Foi uma honra.", evento: "entregar_quest" }] },
      { id: "andamento", texto: "As lanternas ainda chamam por você. Siga a luz no mapa.", escolhas: [{ texto: "Continuo procurando.", evento: "fechar" }] },
      { id: "fim", texto: "O farol brilha de novo. Descanse, herói de Pétala.", escolhas: [{ texto: "Obrigado, mestre.", evento: "fechar" }] },
    ],
  },
  {
    id: "kiko",
    nome: "Kiko",
    papel: "Pescador Sonolento",
    cor: { shirt: "#7ad14a", pants: "#3f7d3a", hair: "#2b2b2b", skin: "#ffd7b0" },
    home: [-62, 30],
    rota: [[-62, 30], [-58, 36], [-66, 34]],
    rotina: "dormir",
    falas: [
      { id: "start", texto: "Zzz... ah! Peguei um peixe? Não... só um sonho. Nade no lago, a água é ótima.", escolhas: [{ texto: "Vou nadar!", evento: "fechar" }, { texto: "Bons sonhos.", evento: "presente" }] },
      { id: "fim", texto: "Se achar uma concha espiral na praia, guarde. Dá sorte.", escolhas: [{ texto: "Anotado.", evento: "fechar" }] },
    ],
  },
  {
    id: "mira",
    nome: "Mira",
    papel: "Ferreira Viajante",
    cor: { shirt: "#c77dff", pants: "#4b3b6b", hair: "#ff8fb1", skin: "#a86b4c" },
    home: [14, -26],
    rota: [[14, -26], [20, -30], [12, -34]],
    rotina: "trabalhar",
    falas: [
      { id: "start", texto: "Precisa de equipamento? Junte cristais na caverna e eu ensino a forjar a Lâmina da Lua.", escolhas: [{ texto: "Como funciona a forja?", proximo: "fim" }, { texto: "Depois eu volto.", evento: "fechar" }] },
      { id: "fim", texto: "Abra a bancada de criação no menu, junte os materiais e pronto.", escolhas: [{ texto: "Entendi!", evento: "fechar" }] },
    ],
  },
];

export interface QuestDef {
  id: string;
  titulo: string;
  tipo: "principal" | "secundaria";
  npc: string;
  objetivo: string;
  alvo: number;
  contador: "item:mel" | "matar:slime" | "item:lanterna";
  recompensa: { moedas: number; itens: { id: string; qtd: number }[] };
  destino?: [number, number];
}

export const QUESTS: Record<string, QuestDef> = {
  q_lanternas: {
    id: "q_lanternas",
    titulo: "As Três Lanternas",
    tipo: "principal",
    npc: "mestre_sol",
    objetivo: "Recupere as 3 lanternas perdidas",
    alvo: 3,
    contador: "item:lanterna",
    recompensa: { moedas: 500, itens: [{ id: "pocao", qtd: 3 }] },
    destino: [52, -78],
  },
  q_mel: {
    id: "q_mel",
    titulo: "Mel para a Nina",
    tipo: "secundaria",
    npc: "nina",
    objetivo: "Colete 3 potes de mel nos campos",
    alvo: 3,
    contador: "item:mel",
    recompensa: { moedas: 80, itens: [{ id: "bolo", qtd: 2 }] },
    destino: [-40, -10],
  },
  q_slime: {
    id: "q_slime",
    titulo: "Trilhas Seguras",
    tipo: "secundaria",
    npc: "tobi",
    objetivo: "Derrote 5 geleias saltitantes",
    alvo: 5,
    contador: "matar:slime",
    recompensa: { moedas: 150, itens: [{ id: "espada", qtd: 1 }] },
    destino: [-70, 40],
  },
};
