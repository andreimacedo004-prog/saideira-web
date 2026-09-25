import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAutenticacao } from "../auth/AuthContext";
import { mensagemDeErro } from "../api/client";
import { meusDesafios } from "../api/desafios";
import { criarGrupo, entrarNoGrupo, meusGrupos } from "../api/grupos";
import { useRequisicao } from "../ganchos/useRequisicao";
import { STATUS_DESAFIO, plural } from "../rotulos";
import { descreverPrazo } from "../tempo";

type Painel = "nenhum" | "criar" | "codigo";

export default function Inicio() {
  const { usuario } = useAutenticacao();
  const navegar = useNavigate();

  const desafios = useRequisicao(meusDesafios);
  const grupos = useRequisicao(meusGrupos);

  const [painel, setPainel] = useState<Painel>("nenhum");
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const primeiroNome = usuario?.nome.split(" ")[0] ?? "";
  const semGrupo = grupos.dados !== null && grupos.dados.length === 0;

  function abrir(qual: Painel) {
    setPainel(painel === qual ? "nenhum" : qual);
    setTexto("");
    setErro(null);
  }

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    if (!texto.trim()) return;
    setErro(null);
    setEnviando(true);
    try {
      const grupo = painel === "criar" ? await criarGrupo(texto.trim()) : await entrarNoGrupo(texto.trim());
      navegar(`/grupos/${grupo.id}`);
    } catch (problema) {
      setErro(mensagemDeErro(problema));
      setEnviando(false);
    }
  }

  return (
    <div className="pagina">
      <h1 className="saudacao">E aí, {primeiroNome}</h1>

      {semGrupo && (
        <section className="boas-vindas">
          <p className="boas-vindas__titulo">Primeiro rolê por aqui?</p>
          <ol className="boas-vindas__passos">
            <li>Crie um grupo para a galera</li>
            <li>Mande o link de convite no grupo do WhatsApp</li>
            <li>Crie um desafio com data para acabar</li>
            <li>Todo rolê vira check-in, e o ranking se monta sozinho</li>
          </ol>
          <p className="boas-vindas__apoio">Se alguém já criou o grupo, peça o link ou o código.</p>
        </section>
      )}

      <div className="acoes">
        <button className="botao" onClick={() => abrir("criar")}>
          Criar grupo
        </button>
        <button className="botao botao--secundario" onClick={() => abrir("codigo")}>
          Tenho um código
        </button>
      </div>

      {painel !== "nenhum" && (
        <form className="painel" onSubmit={aoEnviar}>
          <label className="campo">
            <span className="campo__rotulo">{painel === "criar" ? "Nome do grupo" : "Código do convite"}</span>
            <input
              className="campo__entrada"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder={painel === "criar" ? "Resenha da Facul" : "ex.: k7m2p9qx"}
              maxLength={60}
              autoFocus
              autoCapitalize={painel === "codigo" ? "none" : "sentences"}
            />
          </label>
          {erro && (
            <p className="erro" role="alert">
              {erro}
            </p>
          )}
          <button className="botao" type="submit" disabled={enviando || !texto.trim()}>
            {enviando ? "Aguarde…" : painel === "criar" ? "Criar" : "Entrar no grupo"}
          </button>
        </form>
      )}

      <section className="secao">
        <h2 className="secao__titulo">Desafios</h2>
        {desafios.carregando && <p className="apagado">Carregando…</p>}
        {desafios.erro && <p className="erro">{desafios.erro}</p>}
        {desafios.dados?.length === 0 && !semGrupo && (
          <p className="apagado">Nenhum desafio ainda. Abra um grupo e crie o primeiro.</p>
        )}

        <ul className="lista">
          {desafios.dados?.map((d) => (
            <li key={d.id}>
              <Link to={`/desafios/${d.id}`} className={`cartao-desafio cartao-desafio--${d.status.toLowerCase()}`}>
                <span className={`selo selo--${d.status.toLowerCase()}`}>{STATUS_DESAFIO[d.status]}</span>
                <span className="cartao-desafio__nome">{d.nome}</span>
                <span className="cartao-desafio__detalhe">
                  {d.grupoNome} · {descreverPrazo(d.dataInicio, d.dataFim)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {grupos.dados && grupos.dados.length > 0 && (
        <section className="secao">
          <h2 className="secao__titulo">Seus grupos</h2>
          <ul className="lista">
            {grupos.dados.map((g) => (
              <li key={g.id}>
                <Link to={`/grupos/${g.id}`} className="linha-grupo">
                  <span className="linha-grupo__nome">{g.nome}</span>
                  <span className="apagado">{plural(g.membros.length, "pessoa", "pessoas")}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
