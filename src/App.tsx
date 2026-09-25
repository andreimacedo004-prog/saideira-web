import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router-dom";
import RotaProtegida from "./componentes/RotaProtegida";
import RolarParaOTopo from "./componentes/RolarParaOTopo";
import Layout from "./componentes/Layout";
import Entrar from "./paginas/Entrar";
import Inicio from "./paginas/Inicio";
import Grupo from "./paginas/Grupo";
import Convite from "./paginas/Convite";
import Desafio from "./paginas/Desafio";
import NovoCheckIn from "./paginas/NovoCheckIn";

/**
 * A `key` com o id faz a tela recomecar do zero ao trocar de desafio/grupo,
 * em vez de mostrar por um instante os dados do anterior.
 */
function DesafioPorId() {
  const { desafioId } = useParams();
  return <Desafio key={desafioId} />;
}

function GrupoPorId() {
  const { grupoId } = useParams();
  return <Grupo key={grupoId} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <RolarParaOTopo />
      <Routes>
        <Route path="/entrar" element={<Entrar />} />

        {/* Tudo aqui dentro exige login e compartilha o mesmo cabecalho. */}
        <Route
          element={
            <RotaProtegida>
              <Layout />
            </RotaProtegida>
          }
        >
          <Route path="/" element={<Inicio />} />
          <Route path="/grupos/:grupoId" element={<GrupoPorId />} />
          {/* Link que a galera recebe: saideira.app/convite/abc12345 */}
          <Route path="/convite/:codigo" element={<Convite />} />
          <Route path="/desafios/:desafioId" element={<DesafioPorId />} />
          <Route path="/desafios/:desafioId/checkin" element={<NovoCheckIn />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
