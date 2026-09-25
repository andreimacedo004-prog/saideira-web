import { useState } from "react";
import { mensagemDeErro } from "../api/client";
import { apagarCheckIn, desfazerReacao, reagir } from "../api/checkins";
import { useAutenticacao } from "../auth/AuthContext";
import { fotoOtimizada } from "../fotos";
import { REACOES, plural, tipoDeRole } from "../rotulos";
import { tempoRelativo } from "../tempo";
import type { CheckIn, ReacaoResumo, TipoReacao } from "../tipos";
import Avatar from "./Avatar";
import Comentarios from "./Comentarios";

interface Props {
  checkIn: CheckIn;
  aoApagar: (checkInId: number) => void;
}

/** De onde vieram os pontos, em texto curto: "rolê 10 · 2 cervejas novas · 1 amigo · lugar novo" */
function explicarPontos(c: CheckIn): string {
  const partes = ["rolê"];
  if (c.pontos.cervejasNovas > 0) partes.push(plural(c.pontos.cervejasNovas, "cerveja nova", "cervejas novas"));
  if (c.pontos.amigosMarcados > 0) partes.push(plural(c.pontos.amigosMarcados, "amigo", "amigos"));
  if (c.pontos.lugarNovo) partes.push("lugar novo");
  return partes.join(" · ");
}

export default function CartaoCheckIn({ checkIn, aoApagar }: Props) {
  const { usuario } = useAutenticacao();
  const [reacoes, setReacoes] = useState<ReacaoResumo[]>(checkIn.reacoes);
  const [totalComentarios, setTotalComentarios] = useState(checkIn.totalComentarios);
  const [comentariosAbertos, setComentariosAbertos] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const tipo = tipoDeRole(checkIn.tipo);
  const meu = usuario?.id === checkIn.autor.id;

  async function alternarReacao(tipoReacao: TipoReacao) {
    const jaReagi = reacoes.find((r) => r.tipo === tipoReacao)?.reagi ?? false;
    setErro(null);
    try {
      setReacoes(jaReagi ? await desfazerReacao(checkIn.id, tipoReacao) : await reagir(checkIn.id, tipoReacao));
    } catch (problema) {
      setErro(mensagemDeErro(problema));
    }
  }

  async function apagar() {
    if (!window.confirm("Apagar este check-in? Os pontos dele saem do ranking.")) return;
    try {
      await apagarCheckIn(checkIn.id);
      aoApagar(checkIn.id);
    } catch (problema) {
      setErro(mensagemDeErro(problema));
    }
  }

  return (
    <article className="checkin">
      <header className="checkin__topo">
        <Avatar usuario={checkIn.autor} tamanho={40} />
        <div className="checkin__quem">
          <p className="checkin__autor">
            <strong>{checkIn.autor.nome}</strong>
            <span className="apagado"> em </span>
            <strong>{checkIn.local}</strong>
          </p>
          <p className="checkin__quando">
            {tipo.emoji} {tipo.rotulo} · {tempoRelativo(checkIn.feitoEm)}
          </p>
        </div>
        <span className="checkin__pontos" title={explicarPontos(checkIn)}>
          +{checkIn.pontos.total}
        </span>
      </header>

      {checkIn.fotoUrl && (
        <img
          className="checkin__foto"
          src={fotoOtimizada(checkIn.fotoUrl, 900)}
          alt={`Foto do rolê de ${checkIn.autor.nome} em ${checkIn.local}`}
          loading="lazy"
        />
      )}

      <div className="checkin__corpo">
        {checkIn.legenda && <p className="checkin__legenda">{checkIn.legenda}</p>}

        {checkIn.amigos.length > 0 && (
          <p className="checkin__com">
            com {checkIn.amigos.map((a) => a.nome.split(" ")[0]).join(", ")}
          </p>
        )}

        {checkIn.cervejas.length > 0 && (
          <ul className="fichas">
            {checkIn.cervejas.map((c) => (
              <li key={c.id} className="ficha">
                🍺 {c.nome}
              </li>
            ))}
          </ul>
        )}

        <p className="checkin__explicacao">
          <span>{explicarPontos(checkIn)}</span>
          {meu && (
            <button className="link link--perigo" onClick={apagar}>
              Apagar
            </button>
          )}
        </p>
      </div>

      <footer className="checkin__rodape">
        <div className="reacoes">
          {REACOES.map((r) => {
            const resumo = reacoes.find((x) => x.tipo === r.tipo);
            return (
              <button
                key={r.tipo}
                className={resumo?.reagi ? "reacao reacao--minha" : "reacao"}
                onClick={() => alternarReacao(r.tipo)}
                aria-pressed={resumo?.reagi ?? false}
                aria-label={r.rotulo}
              >
                <span aria-hidden="true">{r.emoji}</span>
                {resumo && resumo.total > 0 && <span className="reacao__total">{resumo.total}</span>}
              </button>
            );
          })}
        </div>

        <button className="link" onClick={() => setComentariosAbertos((a) => !a)}>
          💬 {totalComentarios > 0 ? totalComentarios : "Comentar"}
        </button>
      </footer>

      {erro && <p className="erro pequeno checkin__erro">{erro}</p>}

      {comentariosAbertos && (
        <Comentarios
          checkInId={checkIn.id}
          donoDoCheckInId={checkIn.autor.id}
          aoMudarTotal={setTotalComentarios}
        />
      )}
    </article>
  );
}
