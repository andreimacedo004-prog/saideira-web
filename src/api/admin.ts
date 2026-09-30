import { api } from "./client";
import type {
  AdminAjuste,
  AdminDesafio,
  AdminDesafioDetalhe,
  AdminPreviaExclusao,
  AdminResumo,
  AdminUsuario,
  Desafio,
} from "../tipos";

/*
 * Area de admin. O servidor so responde para as contas de APP_ADMIN_EMAILS;
 * para qualquer outra devolve 403, entao nada aqui depende do app esconder botao.
 */

export const resumo = () => api.get<AdminResumo>("/api/admin/resumo");

export const usuarios = (busca = "") =>
  api.get<AdminUsuario[]>(`/api/admin/usuarios${busca.trim() ? `?busca=${encodeURIComponent(busca.trim())}` : ""}`);

export const previaExclusao = (usuarioId: number) =>
  api.get<AdminPreviaExclusao>(`/api/admin/usuarios/${usuarioId}/exclusao`);

export const excluirUsuario = (usuarioId: number) => api.delete(`/api/admin/usuarios/${usuarioId}`);

export const gerarSenhaTemporaria = (usuarioId: number) =>
  api.post<{ senha: string }>(`/api/admin/usuarios/${usuarioId}/senha-temporaria`);

export const desafios = () => api.get<AdminDesafio[]>("/api/admin/desafios");

export const desafio = (desafioId: number) => api.get<AdminDesafioDetalhe>(`/api/admin/desafios/${desafioId}`);

export const ajustarPontos = (desafioId: number, dados: { usuarioId: number; pontos: number; motivo: string }) =>
  api.post<AdminAjuste>(`/api/admin/desafios/${desafioId}/ajustes`, dados);

/** minutos = null volta ao padrao do app */
export const definirIntervalo = (desafioId: number, minutos: number | null) =>
  api.put<Desafio>(`/api/admin/desafios/${desafioId}/intervalo`, { minutos });

export const removerAjuste = (ajusteId: number) => api.delete(`/api/admin/ajustes/${ajusteId}`);

export const apagarCheckIn = (checkInId: number) => api.delete(`/api/admin/checkins/${checkInId}`);

export const apagarComentario = (comentarioId: number) => api.delete(`/api/admin/comentarios/${comentarioId}`);
