import type { OpcaoDeFormato, StatusDesafio, TipoReacao, TipoRole } from "./tipos";

/** Como cada tipo de role aparece na tela. A ordem aqui e a ordem dos botoes. */
export const TIPOS_DE_ROLE: { valor: TipoRole; emoji: string; rotulo: string }[] = [
  { valor: "BAR", emoji: "🍺", rotulo: "Bar" },
  { valor: "FESTA", emoji: "🎉", rotulo: "Festa" },
  { valor: "CHURRASCO", emoji: "🍖", rotulo: "Churrasco" },
  { valor: "SHOW", emoji: "🎸", rotulo: "Show" },
  { valor: "VISITA", emoji: "🏠", rotulo: "Visita" },
  { valor: "OUTRO", emoji: "✨", rotulo: "Outro" },
];

export function tipoDeRole(tipo: TipoRole) {
  return TIPOS_DE_ROLE.find((t) => t.valor === tipo) ?? TIPOS_DE_ROLE[TIPOS_DE_ROLE.length - 1];
}

export const REACOES: { tipo: TipoReacao; emoji: string; rotulo: string }[] = [
  { tipo: "BRINDE", emoji: "🍻", rotulo: "Brinde" },
  { tipo: "FOGO", emoji: "🔥", rotulo: "Fogo" },
  { tipo: "RISADA", emoji: "😂", rotulo: "Risada" },
  { tipo: "LENDA", emoji: "👑", rotulo: "Lenda" },
];

/**
 * Os formatos vem de /api/regras (fonte da verdade, com o volume de cada um).
 * Esta copia so e usada se as regras ainda nao carregaram.
 */
export const FORMATOS_PADRAO: OpcaoDeFormato[] = [
  { valor: "LATA", rotulo: "Lata", mililitros: 350 },
  { valor: "LATAO", rotulo: "Latão", mililitros: 473 },
  { valor: "LONG_NECK", rotulo: "Long neck", mililitros: 330 },
  { valor: "GARRAFA", rotulo: "Garrafa", mililitros: 600 },
  { valor: "LITRAO", rotulo: "Litrão", mililitros: 1000 },
  { valor: "CHOPP", rotulo: "Chopp", mililitros: 300 },
];

export const STATUS_DESAFIO: Record<StatusDesafio, string> = {
  EM_BREVE: "Em breve",
  ATIVO: "Valendo",
  ENCERRADO: "Encerrado",
};

/** 1 -> "1 rolê", 2 -> "2 rolês" */
export function plural(quantidade: number, singular: string, pluralDaPalavra: string) {
  return `${quantidade} ${quantidade === 1 ? singular : pluralDaPalavra}`;
}
