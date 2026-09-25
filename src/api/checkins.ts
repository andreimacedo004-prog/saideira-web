import { api } from "./client";
import type { Comentario, ReacaoResumo, TipoReacao } from "../tipos";

export const apagarCheckIn = (checkInId: number) => api.delete(`/api/checkins/${checkInId}`);

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
