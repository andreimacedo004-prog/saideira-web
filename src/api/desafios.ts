import { api } from "./client";
import type { CheckIn, Desafio, NovoCheckIn, PosicaoRanking, Regras, Retrospectiva } from "../tipos";

export const meusDesafios = () => api.get<Desafio[]>("/api/desafios");

export const buscarDesafio = (desafioId: number) => api.get<Desafio>(`/api/desafios/${desafioId}`);

/** So quem criou. So o nome muda; as datas ficam. */
export const renomearDesafio = (desafioId: number, nome: string) =>
  api.patch<Desafio>(`/api/desafios/${desafioId}`, { nome });

/** So quem criou. Leva junto os check-ins, reacoes e comentarios do desafio. */
export const apagarDesafio = (desafioId: number) => api.delete(`/api/desafios/${desafioId}`);

export const ranking = (desafioId: number) => api.get<PosicaoRanking[]>(`/api/desafios/${desafioId}/ranking`);

export const feed = (desafioId: number) => api.get<CheckIn[]>(`/api/desafios/${desafioId}/checkins`);

export const fazerCheckIn = (desafioId: number, dados: NovoCheckIn) =>
  api.post<CheckIn>(`/api/desafios/${desafioId}/checkins`, dados);

export const regras = () => api.get<Regras>("/api/regras");

/** Soma escondida (litros por formato x quantidade). Vai alimentar o Wrapped no fim do desafio. */
export const retrospectiva = (desafioId: number) =>
  api.get<Retrospectiva>(`/api/desafios/${desafioId}/retrospectiva`);
