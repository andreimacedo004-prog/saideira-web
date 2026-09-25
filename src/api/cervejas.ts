import { api } from "./client";
import type { Cerveja } from "../tipos";

export const buscarCervejas = (busca: string) =>
  api.get<Cerveja[]>(`/api/cervejas?busca=${encodeURIComponent(busca)}`);

/** Se ja existir (mesmo nome, ignorando maiusculas e acentos), o backend devolve a existente. */
export const cadastrarCerveja = (nome: string) => api.post<Cerveja>("/api/cervejas", { nome });
