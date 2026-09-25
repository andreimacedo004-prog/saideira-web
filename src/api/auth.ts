import { api } from "./client";
import type { RespostaDeAutenticacao, Usuario } from "../tipos";

export interface DadosDeCadastro {
  email: string;
  senha: string;
  nome: string;
  maiorDeIdade: boolean;
}

export function cadastrar(dados: DadosDeCadastro) {
  return api.post<RespostaDeAutenticacao>("/api/auth/cadastro", dados);
}

export function entrar(dados: { email: string; senha: string }) {
  return api.post<RespostaDeAutenticacao>("/api/auth/login", dados);
}

export function meuPerfil() {
  return api.get<Usuario>("/api/usuarios/eu");
}
