import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { buscarDesafio, feed, ranking, regras as buscarRegras } from "../api/desafios";
import { useAutenticacao } from "../auth/AuthContext";
import CartaoCheckIn from "../componentes/CartaoCheckIn";
import GerenciarDesafio from "../componentes/GerenciarDesafio";
import MeuResumo from "../componentes/MeuResumo";
import Ranking from "../componentes/Ranking";
import { useRequisicao } from "../ganchos/useRequisicao";
import { STATUS_DESAFIO } from "../rotulos";
import { descreverPrazo, formatarDiaMes } from "../tempo";

type Aba = "feed" | "ranking" | "resumo";

function lerAba(valor: string | null): Aba {
  return valor === "ranking" || valor === "resumo" ? valor : "feed";
}

export default function Desafio() {
  const desafioId = Number(useParams().desafioId);
  const [parametros, setParametros] = useSearchParams();
  const aba = lerAba(parametros.get("aba"));

  const desafio = useRequisicao(() => buscarDesafio(desafioId), desafioId);
  const checkIns = useRequisicao(() => feed(desafioId), desafioId);
  const posicoes = useRequisicao(() => ranking(desafioId), desafioId);
  const regras = useRequisicao(buscarRegras);
  const { usuario } = useAutenticacao();
  const [editando, setEditando] = useState(false);

  // Recado vindo da tela de check-in: "+23 pts!"
  const local = useLocation();
  const navegar = useNavigate();
  const [recado] = useState(() => ({
    pontos: (local.state as { pontosGanhos?: number } | null)?.pontosGanhos ?? null,
    caminho: local.pathname + local.search,
  }));
  const pontosGanhos = recado.pontos;
  const [mostrarRecado, setMostrarRecado] = useState(pontosGanhos !== null);

  useEffect(() => {
    if (recado.pontos === null) return;
    // Limpa o state para o recado nao voltar ao recarregar a pagina
    navegar(recado.caminho, { replace: true, state: null });
    const timer = window.setTimeout(() => setMostrarRecado(false), 3500);
    return () => window.clearTimeout(timer);
  }, [recado, navegar]);

  function trocarAba(nova: Aba) {
    setParametros(nova === "feed" ? {} : { aba: nova }, { replace: true });
    // Ranking muda com check-ins, reacoes nao: atualiza ao abrir a aba
    if (nova === "ranking") posicoes.recarregar();
  }

  function aoApagar(checkInId: number) {
    checkIns.definir((lista) => (lista ?? []).filter((c) => c.id !== checkInId));
    posicoes.recarregar();
  }

  if (desafio.erro) return <p className="erro pagina">{desafio.erro}</p>;
  if (!desafio.dados) return <p className="apagado pagina">Carregando…</p>;

  const d = desafio.dados;
  const ativo = d.status === "ATIVO";
  const souCriador = usuario?.id === d.criadoPorId;

  return (
    <div className="pagina pagina--com-botao">
      {mostrarRecado && pontosGanhos !== null && (
        <div className="recado" role="status">
          Check-in feito! <strong>+{pontosGanhos} pts</strong> 🍻
        </div>
      )}

      <Link to={`/grupos/${d.grupoId}`} className="voltar">
        ← {d.grupoNome}
      </Link>
      <div className="desafio__cabecalho">
        <h1 className="titulo">{d.nome}</h1>
        <p className="apagado">
          <span className={`selo selo--${d.status.toLowerCase()}`}>{STATUS_DESAFIO[d.status]}</span>{" "}
          {formatarDiaMes(d.dataInicio)} a {formatarDiaMes(d.dataFim)} · {descreverPrazo(d.dataInicio, d.dataFim)}
        </p>
        {souCriador && !editando && (
          <button className="link desafio__editar" onClick={() => setEditando(true)}>
            ✏️ Editar desafio
          </button>
        )}
      </div>

      {editando && (
        <GerenciarDesafio
          desafio={d}
          totalCheckIns={checkIns.dados ? checkIns.dados.length : null}
          aoRenomear={(atualizado) => {
            desafio.definir(() => atualizado);
            setEditando(false);
          }}
          aoApagar={() => navegar(`/grupos/${d.grupoId}`, { replace: true })}
          aoFechar={() => setEditando(false)}
        />
      )}

      <div className="abas" role="tablist">
        <button role="tab" aria-selected={aba === "feed"} className={aba === "feed" ? "aba aba--ativa" : "aba"} onClick={() => trocarAba("feed")}>
          Feed
        </button>
        <button role="tab" aria-selected={aba === "ranking"} className={aba === "ranking" ? "aba aba--ativa" : "aba"} onClick={() => trocarAba("ranking")}>
          Ranking
        </button>
        <button role="tab" aria-selected={aba === "resumo"} className={aba === "resumo" ? "aba aba--ativa" : "aba"} onClick={() => trocarAba("resumo")}>
          Meu resumo
        </button>
      </div>

      {aba === "feed" && (
        <section>
          {checkIns.erro && <p className="erro">{checkIns.erro}</p>}
          {checkIns.carregando && <p className="apagado">Carregando…</p>}
          {checkIns.dados?.length === 0 && (
            <div className="vazio">
              <p className="vazio__emoji">🍺</p>
              <p>Ninguém fez check-in ainda.</p>
              <p className="apagado">{ativo ? "Abre os trabalhos!" : "O desafio ainda não começou."}</p>
            </div>
          )}
          <div className="feed">
            {checkIns.dados?.map((c) => (
              <CartaoCheckIn key={c.id} checkIn={c} aoApagar={aoApagar} />
            ))}
          </div>
        </section>
      )}

      {aba === "ranking" && (
        <section>
          {posicoes.erro && <p className="erro">{posicoes.erro}</p>}
          {posicoes.dados && <Ranking posicoes={posicoes.dados} regras={regras.dados} />}
        </section>
      )}

      {aba === "resumo" && (
        <section>
          <MeuResumo desafioId={d.id} />
        </section>
      )}

      {ativo && (
        <Link to={`/desafios/${d.id}/checkin`} className="botao botao--flutuante">
          📸 Fazer check-in
        </Link>
      )}
    </div>
  );
}
