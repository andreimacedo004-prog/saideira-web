import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { mensagemDeErro } from "../api/client";
import { entrarNoGrupo } from "../api/grupos";

/**
 * Onde cai quem abre o link de convite (/convite/abc12345).
 * Quem nao tem conta passa antes pelo cadastro e volta para ca (ver RotaProtegida).
 */
export default function Convite() {
  const { codigo = "" } = useParams();
  const navegar = useNavigate();
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function aceitar() {
    setErro(null);
    setEnviando(true);
    try {
      const grupo = await entrarNoGrupo(codigo);
      navegar(`/grupos/${grupo.id}`, { replace: true });
    } catch (problema) {
      setErro(mensagemDeErro(problema));
      setEnviando(false);
    }
  }

  return (
    <div className="pagina convite">
      <p className="convite__emoji" aria-hidden="true">
        🍻
      </p>
      <h1 className="titulo">Te chamaram pro rolê</h1>
      <p className="apagado">
        Convite <strong className="codigo">{codigo}</strong>
      </p>

      {erro && (
        <p className="erro" role="alert">
          {erro}
        </p>
      )}

      <button className="botao botao--largo" onClick={aceitar} disabled={enviando}>
        {enviando ? "Entrando…" : "Entrar no grupo"}
      </button>
    </div>
  );
}
