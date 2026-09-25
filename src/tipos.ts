/**
 * Espelho dos DTOs do backend (pacote com.saideira.backend.dto).
 *
 * Se a API mudar e isto nao acompanhar, o TypeScript avisa na hora de
 * escrever — em vez de o erro aparecer na mao da galera no meio do role.
 */

/** UsuarioResponse.java — o proprio perfil */
export interface Usuario {
  id: number;
  email: string;
  nome: string;
  fotoUrl: string | null;
  bio: string | null;
}

/** UsuarioResumo.java — como os amigos aparecem (sem e-mail) */
export interface UsuarioResumo {
  id: number;
  nome: string;
  fotoUrl: string | null;
}

/** AuthResponse.java */
export interface RespostaDeAutenticacao {
  token: string;
  expiraEmMs: number;
  usuario: Usuario;
}

/** FriendGroupResponse.java */
export interface Grupo {
  id: number;
  nome: string;
  criadoPorId: number;
  codigoConvite: string;
  membros: UsuarioResumo[];
}

/** GET /api/grupos/{id}/convite */
export interface Convite {
  codigo: string;
  link: string;
}

export type StatusDesafio = "EM_BREVE" | "ATIVO" | "ENCERRADO";

/** DesafioResponse.java */
export interface Desafio {
  id: number;
  grupoId: number;
  grupoNome: string;
  nome: string;
  dataInicio: string; // "2026-11-01"
  dataFim: string;
  status: StatusDesafio;
}

/** RankingItemResponse.java */
export interface PosicaoRanking {
  posicao: number;
  usuario: UsuarioResumo;
  pontos: number;
  checkIns: number;
  cervejasNovas: number;
  amigosMarcados: number;
  lugaresNovos: number;
}

export type TipoRole = "BAR" | "FESTA" | "CHURRASCO" | "SHOW" | "VISITA" | "OUTRO";
export type TipoReacao = "BRINDE" | "FOGO" | "RISADA" | "LENDA";

/** CervejaResponse.java */
export interface Cerveja {
  id: number;
  nome: string;
  estilo: string | null;
  cervejaria: string | null;
}

/** PontosResponse.java */
export interface Pontos {
  total: number;
  cervejasNovas: number;
  amigosMarcados: number;
  lugarNovo: boolean;
}

/** ReacaoResumo.java */
export interface ReacaoResumo {
  tipo: TipoReacao;
  total: number;
  reagi: boolean;
}

/** CheckInResponse.java */
export interface CheckIn {
  id: number;
  desafioId: number;
  autor: UsuarioResumo;
  tipo: TipoRole;
  local: string;
  fotoUrl: string | null;
  legenda: string | null;
  feitoEm: string; // "2026-11-06T23:30:00", horario de Brasilia
  amigos: UsuarioResumo[];
  cervejas: Cerveja[];
  pontos: Pontos;
  reacoes: ReacaoResumo[];
  totalComentarios: number;
}

export type FormatoCerveja = "LATA" | "LATAO" | "LONG_NECK" | "GARRAFA" | "LITRAO" | "CHOPP";

/** RegrasResponse.Formato — vem de /api/regras */
export interface OpcaoDeFormato {
  valor: FormatoCerveja;
  rotulo: string;
  mililitros: number;
}

/** ItemCervejaRequest.java — formato e quantidade nao valem ponto, so vao para a retrospectiva */
export interface ItemCerveja {
  cervejaId: number;
  formato: FormatoCerveja;
  quantidade: number;
}

/** RegistrarCheckInRequest.java */
export interface NovoCheckIn {
  tipo: TipoRole;
  local: string;
  fotoUrl?: string;
  legenda?: string;
  feitoEm?: string;
  amigosIds: number[];
  cervejas: ItemCerveja[];
}

/** RetrospectivaResponse.java — base do "Saideira Wrapped" */
export interface Consumo {
  roles: number;
  unidades: number;
  litros: number;
  cervejasDiferentes: number;
}

export interface Retrospectiva {
  desafioId: number;
  /** So o seu volume: ninguem ve o dos outros. */
  eu: Consumo;
  /** Total coletivo da galera. */
  grupo: Consumo;
  minhasCervejas: { cerveja: Cerveja; unidades: number; litros: number }[];
}

/** ComentarioResponse.java */
export interface Comentario {
  id: number;
  checkInId: number;
  autor: UsuarioResumo;
  texto: string;
  criadoEm: string;
}

/** RegrasResponse.java — GET /api/regras */
export interface Regras {
  pontosPorCheckIn: number;
  pontosPorCervejaNova: number;
  pontosPorAmigoMarcado: number;
  pontosPorLugarNovo: number;
  intervaloMinimoMinutos: number;
  maxHorasRetroativo: number;
  maxCervejasPorCheckIn: number;
  formatos: OpcaoDeFormato[];
}
