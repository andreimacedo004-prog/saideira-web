/**
 * Camada unica de acesso a API (mesmo desenho do elofit-web).
 *
 * Nenhum componente chama fetch direto: token, tratamento de erro e sessao
 * expirada ficam num lugar so.
 */

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8280";

const CHAVE_TOKEN = "saideira.token";

export function lerToken(): string | null {
  return localStorage.getItem(CHAVE_TOKEN);
}

export function gravarToken(token: string) {
  localStorage.setItem(CHAVE_TOKEN, token);
}

export function apagarToken() {
  localStorage.removeItem(CHAVE_TOKEN);
}

/** Erro com o status HTTP junto, para a tela decidir o que mostrar. */
export class ErroDaApi extends Error {
  status: number;

  constructor(status: number, mensagem: string) {
    super(mensagem);
    this.status = status;
  }
}

/** Texto amigavel para qualquer erro que chegue num catch. */
export function mensagemDeErro(problema: unknown, padrao = "Algo deu errado. Tente de novo."): string {
  if (problema instanceof ErroDaApi) return problema.message;
  if (problema instanceof Error && problema.message) return problema.message;
  return padrao;
}

// O AuthContext registra aqui o que fazer quando o token morre.
let aoPerderSessao: (() => void) | null = null;

export function registrarPerdaDeSessao(callback: () => void) {
  aoPerderSessao = callback;
}

/**
 * O backend responde erro de dois jeitos:
 *   regra de negocio -> { "erro": "Voce ja fez check-in as 22:10..." }
 *   validacao de DTO -> { "cervejaIds": "No maximo 5 cervejas por check-in" }
 * Esta funcao achata os dois numa frase so.
 */
function extrairMensagem(corpo: unknown): string | null {
  if (!corpo || typeof corpo !== "object") return null;

  const registro = corpo as Record<string, unknown>;
  if (typeof registro.erro === "string") return registro.erro;

  const mensagens = Object.values(registro).filter((v): v is string => typeof v === "string");
  return mensagens.length > 0 ? mensagens.join(". ") : null;
}

export async function requisitar<T>(caminho: string, opcoes: RequestInit = {}): Promise<T> {
  const token = lerToken();

  let resposta: Response;
  try {
    resposta = await fetch(`${BASE}${caminho}`, {
      ...opcoes,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...opcoes.headers,
      },
    });
  } catch {
    // fetch so rejeita quando a requisicao nem saiu: sem internet,
    // backend fora do ar, CORS. Erro HTTP (400, 500) resolve normalmente.
    throw new ErroDaApi(0, "Sem conexão com o servidor. Confere a internet?");
  }

  if (resposta.status === 401 && token) {
    aoPerderSessao?.();
    throw new ErroDaApi(401, "Sua sessão expirou. Entre de novo.");
  }

  if (!resposta.ok) {
    const corpo = await resposta.json().catch(() => null);
    throw new ErroDaApi(resposta.status, extrairMensagem(corpo) ?? "Não foi possível completar a ação.");
  }

  if (resposta.status === 204) return undefined as T;
  return resposta.json() as Promise<T>;
}

function comCorpo(metodo: string, corpo?: unknown): RequestInit {
  return { method: metodo, body: corpo === undefined ? undefined : JSON.stringify(corpo) };
}

export const api = {
  get: <T>(caminho: string) => requisitar<T>(caminho),
  post: <T>(caminho: string, corpo?: unknown) => requisitar<T>(caminho, comCorpo("POST", corpo)),
  put: <T>(caminho: string, corpo?: unknown) => requisitar<T>(caminho, comCorpo("PUT", corpo)),
  patch: <T>(caminho: string, corpo?: unknown) => requisitar<T>(caminho, comCorpo("PATCH", corpo)),
  delete: <T = void>(caminho: string) => requisitar<T>(caminho, { method: "DELETE" }),
};
