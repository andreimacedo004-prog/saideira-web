import { useCallback, useEffect, useRef, useState } from "react";
import { mensagemDeErro } from "../api/client";

interface Estado<T> {
  dados: T | null;
  carregando: boolean;
  erro: string | null;
}

/**
 * Carrega algo da API e devolve os tres estados que toda tela precisa:
 * carregando, erro e dados.
 *
 * `chave` diz quando buscar de novo (ex.: o id do desafio). Diferente do
 * elofit-web, aqui nao se passa uma lista de dependencias: o eslint do
 * React 19 recusa `useCallback(fn, deps)` com deps vindo de fora.
 *
 * `recarregar` busca de novo sem apagar o que ja esta na tela (o feed nao
 * pisca). `definir` troca os dados na mao depois de uma acao, sem ir ao servidor.
 */
export function useRequisicao<T>(buscar: () => Promise<T>, chave: unknown = null) {
  const [estado, setEstado] = useState<Estado<T>>({ dados: null, carregando: true, erro: null });
  const [versao, setVersao] = useState(0);

  // Sempre a funcao mais recente, sem fazer o efeito rodar a cada render
  const buscarAtual = useRef(buscar);
  useEffect(() => {
    buscarAtual.current = buscar;
  });

  useEffect(() => {
    let cancelado = false;

    buscarAtual
      .current()
      .then((dados) => {
        if (!cancelado) setEstado({ dados, carregando: false, erro: null });
      })
      .catch((problema) => {
        if (!cancelado) {
          setEstado((anterior) => ({
            dados: anterior.dados,
            carregando: false,
            erro: mensagemDeErro(problema, "Não foi possível carregar."),
          }));
        }
      });

    return () => {
      cancelado = true;
    };
  }, [chave, versao]);

  const recarregar = useCallback(() => setVersao((v) => v + 1), []);

  const definir = useCallback((atualizar: (atual: T | null) => T) => {
    setEstado((anterior) => ({ ...anterior, dados: atualizar(anterior.dados) }));
  }, []);

  return { ...estado, recarregar, definir };
}
