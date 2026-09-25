import { useState, type FormEvent } from "react";
import { mensagemDeErro } from "../api/client";
import { apagarDesafio, renomearDesafio } from "../api/desafios";
import { plural } from "../rotulos";
import type { Desafio } from "../tipos";

interface Props {
  desafio: Desafio;
  /** Quantos check-ins vao junto se apagar (null enquanto o feed carrega). */
  totalCheckIns: number | null;
  aoRenomear: (desafio: Desafio) => void;
  aoApagar: () => void;
  aoFechar: () => void;
}

/**
 * Painel de quem criou o desafio: mudar o nome ou apagar.
 * Apagar pede uma segunda confirmacao dizendo o que vai junto,
 * porque leva os check-ins da galera toda e nao tem volta.
 */
export default function GerenciarDesafio({ desafio, totalCheckIns, aoRenomear, aoApagar, aoFechar }: Props) {
  const [nome, setNome] = useState(desafio.nome);
  const [salvando, setSalvando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [apagando, setApagando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const nomeLimpo = nome.trim();
  const mudou = nomeLimpo !== "" && nomeLimpo !== desafio.nome;

  async function salvar(evento: FormEvent) {
    evento.preventDefault();
    if (!mudou) return;
    setErro(null);
    setSalvando(true);
    try {
      aoRenomear(await renomearDesafio(desafio.id, nomeLimpo));
    } catch (problema) {
      setErro(mensagemDeErro(problema));
      setSalvando(false);
    }
  }

  async function apagar() {
    setErro(null);
    setApagando(true);
    try {
      await apagarDesafio(desafio.id);
      aoApagar();
    } catch (problema) {
      setErro(mensagemDeErro(problema));
      setApagando(false);
    }
  }

  function oQueVaiJunto() {
    if (totalCheckIns === null) return "Vão junto todos os check-ins dele, com reações e comentários.";
    if (totalCheckIns === 0) return "Ele ainda não tem nenhum check-in.";
    return `Vão junto ${plural(totalCheckIns, "check-in", "check-ins")} da galera, com reações e comentários.`;
  }

  return (
    <section className="painel gerenciar" aria-label="Editar desafio">
      <form onSubmit={salvar}>
        <label className="campo">
          <span className="campo__rotulo">Nome do desafio</span>
          <input
            className="campo__entrada"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            maxLength={80}
            autoFocus
          />
          <span className="campo__ajuda">As datas não mudam, para não bagunçar os check-ins já feitos.</span>
        </label>
        <div className="gerenciar__acoes">
          <button className="botao" type="submit" disabled={!mudou || salvando || apagando}>
            {salvando ? "Salvando…" : "Salvar nome"}
          </button>
          <button className="botao botao--secundario" type="button" onClick={aoFechar} disabled={salvando || apagando}>
            Fechar
          </button>
        </div>
      </form>

      <div className="gerenciar__perigo">
        {confirmando ? (
          <div role="alertdialog" aria-labelledby="apagar-titulo" aria-describedby="apagar-texto">
            <p id="apagar-titulo" className="gerenciar__pergunta">
              Apagar “{desafio.nome}”?
            </p>
            <p id="apagar-texto" className="apagado">
              {oQueVaiJunto()} Não tem como desfazer.
            </p>
            <div className="gerenciar__acoes">
              <button className="botao botao--perigo" onClick={apagar} disabled={apagando}>
                {apagando ? "Apagando…" : "Apagar de vez"}
              </button>
              <button className="botao botao--secundario" onClick={() => setConfirmando(false)} disabled={apagando}>
                Voltar
              </button>
            </div>
          </div>
        ) : (
          <button className="link link--perigo" onClick={() => setConfirmando(true)} disabled={salvando}>
            Apagar desafio
          </button>
        )}
      </div>

      {erro && (
        <p className="erro" role="alert">
          {erro}
        </p>
      )}
    </section>
  );
}
