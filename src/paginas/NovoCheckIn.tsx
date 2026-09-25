import { useParams } from "react-router-dom";
import FormularioCheckIn from "../componentes/FormularioCheckIn";

/** /desafios/:desafioId/checkin */
export default function NovoCheckIn() {
  const desafioId = Number(useParams().desafioId);
  return <FormularioCheckIn desafioId={desafioId} />;
}
