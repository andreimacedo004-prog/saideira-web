import { useEffect, useState } from "react";
import { mensagemDeErro } from "../api/client";
import { buscarCervejas, cadastrarCerveja } from "../api/cervejas";
import type { Cerveja, FormatoCerveja, OpcaoDeFormato } from "../tipos";

/** Uma cerveja escolhida no check-in, com formato e quantidade. */
export interface CervejaEscolhida {
  cerveja: Cerveja;
  formato: FormatoCerveja;
  quantidade: number;
}

interface Props {
  selecionadas: CervejaEscolhida[];
  aoMudar: (cervejas: CervejaEscolhida[]) => void;
  maximo: number;
  formatos: OpcaoDeFormato[];
}

const QUANTIDADE_MAXIMA = 20;

// A galera costuma tomar sempre no mesmo formato: o ultimo usado ja vem marcado
const CHAVE_ULTIMO_FORMATO = "saideira.ultimoFormato";

function ultimoFormato(formatos: OpcaoDeFormato[]): FormatoCerveja {
  try {
    const guardado = localStorage.getItem(CHAVE_ULTIMO_FORMATO);
    if (guardado && formatos.some((f) => f.valor === guardado)) return guardado as FormatoCerveja;
  } catch {
    // navegador sem localStorage (aba anonima em alguns celulares): segue com o padrao
  }
  return formatos[0]?.valor ?? "LATA";
}

function lembrarFormato(formato: FormatoCerveja) {
  try {
    localStorage.setItem(CHAVE_ULTIMO_FORMATO, formato);
  } catch {
    // sem problema: so nao lembra da proxima vez
  }
}

/**
 * Busca no catalogo enquanto a pessoa digita; se nao achar, cadastra na hora.
 * Cada cerveja escolhida ganha formato e quantidade — que NAO valem ponto:
 * vao so para a soma escondida da retrospectiva.
 */
export default function SeletorDeCervejas({ selecionadas, aoMudar, maximo, formatos }: Props) {
  const [busca, setBusca] = useState("");
  const [resultados, setResultados] = useState<Cerveja[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [cadastrando, setCadastrando] = useState(false);

  const termo = busca.trim();
  const cheio = selecionadas.length >= maximo;

  // Espera a pessoa parar de digitar (250 ms) antes de ir ao servidor
  useEffect(() => {
    if (termo.length < 2) return;
    let cancelado = false;
    const timer = window.setTimeout(() => {
      buscarCervejas(termo)
        .then((lista) => {
          if (!cancelado) setResultados(lista);
        })
        .catch(() => {
          if (!cancelado) setResultados([]);
        });
    }, 250);
    return () => {
      cancelado = true;
      window.clearTimeout(timer);
    };
  }, [termo]);

  function adicionar(cerveja: Cerveja) {
    if (!selecionadas.some((s) => s.cerveja.id === cerveja.id)) {
      aoMudar([...selecionadas, { cerveja, formato: ultimoFormato(formatos), quantidade: 1 }]);
    }
    setBusca("");
    setResultados([]);
  }

  function atualizar(cervejaId: number, mudanca: Partial<CervejaEscolhida>) {
    aoMudar(selecionadas.map((s) => (s.cerveja.id === cervejaId ? { ...s, ...mudanca } : s)));
  }

  function trocarFormato(cervejaId: number, formato: FormatoCerveja) {
    lembrarFormato(formato);
    atualizar(cervejaId, { formato });
  }

  function remover(cervejaId: number) {
    aoMudar(selecionadas.filter((s) => s.cerveja.id !== cervejaId));
  }

  async function cadastrarNova() {
    setErro(null);
    setCadastrando(true);
    try {
      adicionar(await cadastrarCerveja(termo));
    } catch (problema) {
      setErro(mensagemDeErro(problema));
    } finally {
      setCadastrando(false);
    }
  }

  const visiveis = termo.length >= 2 ? resultados.filter((r) => !selecionadas.some((s) => s.cerveja.id === r.id)) : [];
  const achouExata = resultados.some((r) => r.nome.toLowerCase() === termo.toLowerCase());

  return (
    <div className="seletor">
      {selecionadas.length > 0 && (
        <ul className="escolhidas">
          {selecionadas.map(({ cerveja, formato, quantidade }) => (
            <li key={cerveja.id} className="escolhida">
              <div className="escolhida__topo">
                <span className="escolhida__nome">🍺 {cerveja.nome}</span>
                <button
                  type="button"
                  className="escolhida__tirar"
                  onClick={() => remover(cerveja.id)}
                  aria-label={`Tirar ${cerveja.nome}`}
                >
                  ×
                </button>
              </div>

              <div className="escolhida__controles">
                <select
                  className="campo__entrada escolhida__formato"
                  value={formato}
                  onChange={(e) => trocarFormato(cerveja.id, e.target.value as FormatoCerveja)}
                  aria-label={`Formato da ${cerveja.nome}`}
                >
                  {formatos.map((f) => (
                    <option key={f.valor} value={f.valor}>
                      {f.rotulo} · {f.mililitros >= 1000 ? `${f.mililitros / 1000} L` : `${f.mililitros} ml`}
                    </option>
                  ))}
                </select>

                <div className="passo" role="group" aria-label={`Quantidade de ${cerveja.nome}`}>
                  <button
                    type="button"
                    onClick={() => atualizar(cerveja.id, { quantidade: quantidade - 1 })}
                    disabled={quantidade <= 1}
                    aria-label="Menos uma"
                  >
                    −
                  </button>
                  <span className="passo__valor" aria-live="polite">
                    {quantidade}
                  </span>
                  <button
                    type="button"
                    onClick={() => atualizar(cerveja.id, { quantidade: quantidade + 1 })}
                    disabled={quantidade >= QUANTIDADE_MAXIMA}
                    aria-label="Mais uma"
                  >
                    +
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {cheio ? (
        <p className="apagado pequeno">Máximo de {maximo} cervejas diferentes por check-in.</p>
      ) : (
        <>
          <input
            className="campo__entrada"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar cerveja (ex.: Heineken, IPA, Ambev)"
            aria-label="Buscar cerveja"
            autoComplete="off"
          />

          {termo.length >= 2 && (
            <ul className="sugestoes">
              {visiveis.slice(0, 6).map((c) => (
                <li key={c.id}>
                  <button type="button" className="sugestao" onClick={() => adicionar(c)}>
                    <span>{c.nome}</span>
                    <span className="apagado pequeno">{[c.estilo, c.cervejaria].filter(Boolean).join(" · ")}</span>
                  </button>
                </li>
              ))}
              {!achouExata && (
                <li>
                  <button type="button" className="sugestao sugestao--nova" onClick={cadastrarNova} disabled={cadastrando}>
                    {cadastrando ? "Cadastrando…" : `+ Cadastrar “${termo}”`}
                  </button>
                </li>
              )}
            </ul>
          )}
        </>
      )}

      {selecionadas.length > 0 && (
        <p className="apagado pequeno seletor__nota">
          Formato e quantidade não valem ponto. Só entram na sua retrospectiva do fim do desafio.
        </p>
      )}

      {erro && <p className="erro pequeno">{erro}</p>}
    </div>
  );
}
