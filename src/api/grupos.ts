import { api } from "./client";
import type { Convite, Desafio, Grupo } from "../tipos";

export const meusGrupos = () => api.get<Grupo[]>("/api/grupos");

export const buscarGrupo = (grupoId: number) => api.get<Grupo>(`/api/grupos/${grupoId}`);

export const criarGrupo = (nome: string) => api.post<Grupo>("/api/grupos", { nome });

export const entrarNoGrupo = (codigoConvite: string) =>
  api.post<Grupo>("/api/grupos/entrar", { codigoConvite });

export const linkDeConvite = (grupoId: number) => api.get<Convite>(`/api/grupos/${grupoId}/convite`);

export const desafiosDoGrupo = (grupoId: number) => api.get<Desafio[]>(`/api/grupos/${grupoId}/desafios`);

export const criarDesafio = (grupoId: number, dados: { nome: string; dataInicio: string; dataFim: string }) =>
  api.post<Desafio>(`/api/grupos/${grupoId}/desafios`, dados);
