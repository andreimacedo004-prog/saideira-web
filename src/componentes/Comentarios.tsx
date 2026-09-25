import { useState, type FormEvent } from "react";
import { mensagemDeErro } from "../api/client";
import { apagarComentario, comentar, comentarios as buscarComentarios } from "../api/checkins";
import { useAutenticacao } from "../auth/AuthContext";
import { useRequisicao } from "../ganchos/useRequisicao";
import { tempoRelativo } from "../tempo";

interface Props {
  checkInId: number;
  donoDoCheckInId: number;
  /** Avisa o card para atualizar o contador de comentarios. */
  aoMudarTotal: (total: number) => void;
}

export default function Comentarios({ checkInId, donoDoCheckInId, aoMudarTotal }: Props) {
  const { usuario } = useAutenticacao();
  const lista = useRequisicao(() => buscarComentarios(checkInId), checkInId);
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    if (!texto.trim()) return;
    setErro(null);
    setEnviando(true);
    try {
      const novo = await comentar(checkInId, texto.trim());
      const atualizada = [...(lista.dados ?? []), novo];
      lista.definir(() => atualizada);
      aoMudarTotal(atualizada.length);
      setTexto("");
    } catch (problema) {
      setErro(mensagemDeErro(problema));
    } finally {
      setEnviando(false);
    }
  }

  async function apagar(comentarioId: number) {
    try {
      await apagarComentario(comentarioId);
      const atualizada = (lista.dados ?? []).filter((c) => c.id !== comentarioId);
      lista.definir(() => atualizada);
      aoMudarTotal(atualizada.length);
    } catch (problema) {
      setErro(mensagemDeErro(problema));
    }
  }

  return (
    <div className="comentarios">
      {lista.carregando && <p className="apagado pequeno">Carregando…</p>}
      <ul className="comentarios__lista">
        {lista.dados?.map((c) => {
          const podeApagar = usuario?.id === c.autor.id || usuario?.id === donoDoCheckInId;
          return (
            <li key={c.id} className="comentario">
              <p>
                <strong>{c.autor.nome.split(" ")[0]}</strong> {c.texto}
              </p>
              <span className="comentario__rodape">
                {tempoRelativo(c.criadoEm)}
                {podeApagar && (
                  <button className="link link--perigo" onClick={() => apagar(c.id)}>
                    apagar
                  </button>
                )}
              </span>
            </li>
          );
        })}
      </ul>

      {erro && <p className="erro pequeno">{erro}</p>}

      <form className="comentarios__form" onSubmit={aoEnviar}>
        <input
          className="campo__entrada"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Comentar…"
          maxLength={500}
          aria-label="Escrever comentário"
        />
        <button className="botao botao--pequeno" type="submit" disabled={enviando || !texto.trim()}>
          Enviar
        </button>
      </form>
    </div>
  );
}
