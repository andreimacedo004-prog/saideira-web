import { useState, type FormEvent } from "react";
import * as admin from "../../api/admin";
import { mensagemDeErro } from "../../api/client";
import { descreverIntervalo } from "../../rotulos";
import type { Desafio } from "../../tipos";

const OPCOES = [15, 30, 45, 60, 90, 180];

interface Props {
  desafio: Desafio;
  /** Intervalo padrao do app (GET /api/regras), para mostrar no "Padrão". */
  padrao: number | null;
  aoSalvar: (desafio: Desafio) => void;
}

/**
 * Intervalo entre check-ins so neste desafio (ex.: 30 min num show).
 * Vale para os proximos check-ins; os que ja existem ficam como estao.
 */
export default function IntervaloDoDesafio({ desafio, padrao, aoSalvar }: Props) {
  const atual = desafio.intervaloMinimoMinutos;
  const [escolha, setEscolha] = useState(atual === null ? "" : String(atual));
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  // Um valor fora da lista (posto pela API) continua aparecendo como opcao
  const opcoes = atual !== null && !OPCOES.includes(atual) ? [...OPCOES, atual].sort((a, b) => a - b) : OPCOES;
  const mudou = escolha !== (atual === null ? "" : String(atual));
  const textoPadrao = padrao ? `Padrão do app (${descreverIntervalo(padrao)})` : "Padrão do app";

  async function salvar(evento: FormEvent) {
    evento.preventDefault();
    if (!mudou) return;
    setErro(null);
    setAviso(null);
    setSalvando(true);
    try {
      const minutos = escolha === "" ? null : Number(escolha);
      const atualizado = await admin.definirIntervalo(desafio.id, minutos);
      aoSalvar(atualizado);
      setAviso(
        minutos === null
          ? "Voltou para o padrão do app."
          : `Salvo: um check-in a cada ${descreverIntervalo(minutos)} neste desafio.`,
      );
    } catch (problema) {
      setErro(mensagemDeErro(problema));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form className="painel" onSubmit={salvar} aria-label="Intervalo entre check-ins">
      <label className="campo">
        <span className="campo__rotulo">Tempo mínimo entre check-ins de cada pessoa</span>
        <select className="campo__entrada" value={escolha} onChange={(e) => setEscolha(e.target.value)}>
          <option value="">{textoPadrao}</option>
          {opcoes.map((minutos) => (
            <option key={minutos} value={minutos}>
              {descreverIntervalo(minutos)}
            </option>
          ))}
        </select>
        <span className="campo__ajuda">
          Só neste desafio. Vale para os próximos check-ins, e a galera vê o tempo novo na tela do desafio.
        </span>
      </label>
      {erro && (
        <p className="erro" role="alert">
          {erro}
        </p>
      )}
      {aviso && (
        <p className="aviso" role="status">
          {aviso}
        </p>
      )}
      <button className="botao" type="submit" disabled={!mudou || salvando}>
        {salvando ? "Salvando…" : "Salvar intervalo"}
      </button>
    </form>
  );
}
