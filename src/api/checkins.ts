import { api } from "./client";
import type { CheckIn, CheckInParaEditar, Comentario, EdicaoCheckIn, ReacaoResumo, TipoReacao } from "../tipos";

export const apagarCheckIn = (checkInId: number) => api.delete(`/api/checkins/${checkInId}`);

/** So o autor. Traz formato e quantidade das cervejas para preencher a tela. */
export const dadosParaEditar = (checkInId: number) =>
  api.get<CheckInParaEditar>(`/api/checkins/${checkInId}/edicao`);

/** So o autor, enquanto o desafio nao acabou. Devolve o card com os pontos recalculados. */
export const editarCheckIn = (checkInId: number, dados: EdicaoCheckIn) =>
  api.put<CheckIn>(`/api/checkins/${checkInId}`, dados);

// Reagir e desfazer sao idempotentes e devolvem o resumo atualizado
export const reagir = (checkInId: number, tipo: TipoReacao) =>
  api.put<ReacaoResumo[]>(`/api/checkins/${checkInId}/reacoes/${tipo}`);

export const desfazerReacao = (checkInId: number, tipo: TipoReacao) =>
  api.delete<ReacaoResumo[]>(`/api/checkins/${checkInId}/reacoes/${tipo}`);

export const comentarios = (checkInId: number) =>
  api.get<Comentario[]>(`/api/checkins/${checkInId}/comentarios`);

export const comentar = (checkInId: number, texto: string) =>
  api.post<Comentario>(`/api/checkins/${checkInId}/comentarios`, { texto });

export const apagarComentario = (comentarioId: number) => api.delete(`/api/comentarios/${comentarioId}`);
