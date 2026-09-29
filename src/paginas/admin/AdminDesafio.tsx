import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import * as admin from "../../api/admin";
import { mensagemDeErro } from "../../api/client";
import { useAutenticacao } from "../../auth/AuthContext";
import Ranking from "../../componentes/Ranking";
import { useRequisicao } from "../../ganchos/useRequisicao";
import { STATUS_DESAFIO, plural, tipoDeRole } from "../../rotulos";
import { formatarDiaMes } from "../../tempo";

function formatarDataHora(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function comSinal(pontos: number) {
  return pontos > 0 ? `+${pontos}` : `−${Math.abs(pontos)}`;
}

/** /admin/desafios/:desafioId — ranking, ajustes de pontos e check-ins de um desafio. */
export default function AdminDesafio() {
  const { usuario } = useAutenticacao();
  if (!usuario?.admin) return <p className="erro pagina">Área só para admin.</p>;
  return <Detalhe />;
}

function Detalhe() {
  const desafioId = Number(useParams().desafioId);
  const detalhe = useRequisicao(() => admin.desafio(desafioId), desafioId);

  const [pessoa, setPessoa] = useState("");
  const [pontos, setPontos] = useState("");
  const [motivo, setMotivo] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const valor = Number(pontos);
  const podeAjustar = pessoa !== "" && Number.isInteger(valor) && valor !== 0 && motivo.trim().length >= 3;

  async function ajustar(evento: FormEvent) {
    evento.preventDefault();
    if (!podeAjustar) return;
    setErro(null);
    setSalvando(true);
    try {
      await admin.ajustarPontos(desafioId, { usuarioId: Number(pessoa), pontos: valor, motivo: motivo.trim() });
      setPontos("");
      setMotivo("");
      detalhe.recarregar();
    } catch (problema) {
      setErro(mensagemDeErro(problema));
    } finally {
      setSalvando(false);
    }
  }

  async function desfazer(ajusteId: number) {
    if (!window.confirm("Desfazer este ajuste? Os pontos voltam a ser como antes.")) return;
    try {
      await admin.removerAjuste(ajusteId);
      detalhe.recarregar();
    } catch (problema) {
      setErro(mensagemDeErro(problema));
    }
  }

  async function apagarCheckIn(checkInId: number, autor: string) {
    if (!window.confirm(`Apagar o check-in de ${autor}? Reações e comentários dele vão junto.`)) return;
    try {
      await admin.apagarCheckIn(checkInId);
      detalhe.recarregar();
    } catch (problema) {
      setErro(mensagemDeErro(problema));
    }
  }

  if (detalhe.erro && !detalhe.dados) return <p className="erro pagina">{detalhe.erro}</p>;
  if (!detalhe.dados) return <p className="apagado pagina">Carregando…</p>;

  const { desafio, ranking, checkIns, ajustes, participantes } = detalhe.dados;

  return (
    <div className="pagina admin">
      <Link to="/admin?aba=desafios" className="voltar">
        ← Admin
      </Link>
      <h1 className="titulo">{desafio.nome}</h1>
      <p className="apagado">
        <span className={`selo selo--${desafio.status.toLowerCase()}`}>{STATUS_DESAFIO[desafio.status]}</span>{" "}
        {desafio.grupoNome} · {formatarDiaMes(desafio.dataInicio)} a {formatarDiaMes(desafio.dataFim)}
      </p>

      <section className="secao">
        <h2 className="secao__titulo">Ranking</h2>
        <Ranking posicoes={ranking} regras={null} />
      </section>

      <section className="secao">
        <h2 className="secao__titulo">Ajustar pontos</h2>
        <form className="painel" onSubmit={ajustar} aria-label="Ajustar pontos">
          <label className="campo">
            <span className="campo__rotulo">Pessoa</span>
            <select className="campo__entrada" value={pessoa} onChange={(e) => setPessoa(e.target.value)}>
              <option value="">Escolha…</option>
              {participantes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </label>
          <div className="lado-a-lado">
            <label className="campo">
              <span className="campo__rotulo">Pontos (use − para tirar)</span>
              <input
                className="campo__entrada"
                type="number"
                inputMode="numeric"
                step={1}
                min={-1000}
                max={1000}
                value={pontos}
                onChange={(e) => setPontos(e.target.value)}
                placeholder="-10"
              />
            </label>
            <label className="campo">
              <span className="campo__rotulo">Motivo (a galera vê)</span>
              <input
                className="campo__entrada"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                maxLength={200}
                placeholder="check-in repetido"
              />
            </label>
          </div>
          {erro && (
            <p className="erro" role="alert">
              {erro}
            </p>
          )}
          <button className="botao" type="submit" disabled={!podeAjustar || salvando}>
            {salvando ? "Salvando…" : "Aplicar ajuste"}
          </button>
        </form>

        {ajustes.length > 0 && (
          <ul className="admin__ajustes">
            {ajustes.map((a) => (
              <li key={a.id} className="admin__ajuste">
                <span className={a.pontos > 0 ? "admin__pontos admin__pontos--mais" : "admin__pontos"}>
                  {comSinal(a.pontos)}
                </span>
                <span className="admin__ajuste-texto">
                  <strong>{a.usuario.nome}</strong> · {a.motivo}
                  <span className="apagado pequeno">
                    {" "}
                    · {formatarDataHora(a.criadoEm)}
                    {a.criadoPor ? ` por ${a.criadoPor}` : ""}
                  </span>
                </span>
                <button className="link" onClick={() => desfazer(a.id)}>
                  Desfazer
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="secao">
        <h2 className="secao__titulo">Check-ins ({checkIns.length})</h2>
        {checkIns.length === 0 && <p className="apagado">Nenhum check-in ainda.</p>}
        <ul className="admin__lista">
          {checkIns.map((c) => {
            const tipo = tipoDeRole(c.tipo);
            return (
              <li key={c.id} className="admin__checkin">
                <div>
                  <p className="admin__conta-nome">
                    {c.autor.nome} <span className="apagado">em</span> {c.local}
                  </p>
                  <p className="apagado pequeno">
                    {tipo.emoji} {tipo.rotulo} · {formatarDataHora(c.feitoEm)} ·{" "}
                    {plural(c.comentarios, "comentário", "comentários")}
                  </p>
                </div>
                <div className="admin__checkin-lado">
                  <span className="checkin__pontos">+{c.pontos}</span>
                  <button className="link link--perigo" onClick={() => apagarCheckIn(c.id, c.autor.nome)}>
                    Apagar
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
