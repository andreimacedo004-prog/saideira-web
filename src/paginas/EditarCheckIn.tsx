import { Link, useParams } from "react-router-dom";
import { dadosParaEditar } from "../api/checkins";
import FormularioCheckIn from "../componentes/FormularioCheckIn";
import { useRequisicao } from "../ganchos/useRequisicao";

/**
 * /checkins/:checkInId/editar
 * Busca o check-in como o autor preencheu e abre a mesma tela do check-in.
 * O backend recusa se nao for o autor ou se o desafio ja acabou.
 */
export default function EditarCheckIn() {
  const checkInId = Number(useParams().checkInId);
  const edicao = useRequisicao(() => dadosParaEditar(checkInId), checkInId);

  if (edicao.erro) {
    return (
      <div className="pagina">
        <Link to="/" className="voltar">
          ← Início
        </Link>
        <p className="erro">{edicao.erro}</p>
      </div>
    );
  }
  if (!edicao.dados) return <p className="apagado pagina">Carregando…</p>;

  return <FormularioCheckIn desafioId={edicao.dados.desafioId} edicao={edicao.dados} />;
}
