import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { mensagemDeErro } from "../api/client";
import { buscarGrupo, criarDesafio, desafiosDoGrupo, linkDeConvite } from "../api/grupos";
import Avatar from "../componentes/Avatar";
import { useRequisicao } from "../ganchos/useRequisicao";
import { STATUS_DESAFIO, plural } from "../rotulos";
import { descreverPrazo, paraDataIso } from "../tempo";

/** Fim sugerido: 31/12 deste ano (o desafio de fim de ano), ou 30 dias se ja passou. */
function fimSugerido(hoje = new Date()): string {
  const fimDoAno = new Date(hoje.getFullYear(), 11, 31);
  const diasAteOFim = (fimDoAno.getTime() - hoje.getTime()) / 86_400_000;
  if (diasAteOFim >= 14) return paraDataIso(fimDoAno);
  const daquiUmMes = new Date(hoje);
  daquiUmMes.setDate(hoje.getDate() + 30);
  return paraDataIso(daquiUmMes);
}

export default function Grupo() {
  const grupoId = Number(useParams().grupoId);
  const navegar = useNavigate();

  const grupo = useRequisicao(() => buscarGrupo(grupoId), grupoId);
  const desafios = useRequisicao(() => desafiosDoGrupo(grupoId), grupoId);

  const [avisoConvite, setAvisoConvite] = useState<string | null>(null);

  const [criando, setCriando] = useState(false);
  const [nome, setNome] = useState("Rolês de Fim de Ano");
  const [inicio, setInicio] = useState(() => paraDataIso(new Date()));
  const [fim, setFim] = useState(() => fimSugerido());
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function chamarAGalera() {
    setAvisoConvite(null);
    try {
      const convite = await linkDeConvite(grupoId);
      const texto = `Bora pro ${grupo.dados?.nome ?? "grupo"} no Saideira! 🍻`;

      // No celular abre o menu de compartilhar do sistema (WhatsApp etc.)
      if (navigator.share) {
        try {
          await navigator.share({ title: "Saideira", text: texto, url: convite.link });
          return;
        } catch (problema) {
          if (problema instanceof DOMException && problema.name === "AbortError") return; // fechou o menu
        }
      }
      await navigator.clipboard.writeText(`${texto} ${convite.link}`);
      setAvisoConvite(`Link copiado! Código: ${convite.codigo}`);
    } catch (problema) {
      setAvisoConvite(mensagemDeErro(problema, "Não foi possível gerar o convite."));
    }
  }

  async function aoCriarDesafio(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      const desafio = await criarDesafio(grupoId, { nome: nome.trim(), dataInicio: inicio, dataFim: fim });
      navegar(`/desafios/${desafio.id}`);
    } catch (problema) {
      setErro(mensagemDeErro(problema));
      setEnviando(false);
    }
  }

  if (grupo.erro) return <p className="erro pagina">{grupo.erro}</p>;
  if (!grupo.dados) return <p className="apagado pagina">Carregando…</p>;

  return (
    <div className="pagina">
      <Link to="/" className="voltar">
        ← Início
      </Link>
      <h1 className="titulo">{grupo.dados.nome}</h1>
      <p className="apagado">{plural(grupo.dados.membros.length, "pessoa", "pessoas")}</p>

      <ul className="membros">
        {grupo.dados.membros.map((m) => (
          <li key={m.id} className="membro">
            <Avatar usuario={m} tamanho={44} />
            <span className="membro__nome">{m.nome.split(" ")[0]}</span>
          </li>
        ))}
      </ul>

      <button className="botao botao--largo" onClick={chamarAGalera}>
        Chamar a galera 🍻
      </button>
      {avisoConvite && <p className="aviso">{avisoConvite}</p>}

      <section className="secao">
        <div className="secao__cabecalho">
          <h2 className="secao__titulo">Desafios</h2>
          <button className="link" onClick={() => setCriando((c) => !c)}>
            {criando ? "Cancelar" : "+ Novo desafio"}
          </button>
        </div>

        {criando && (
          <form className="painel" onSubmit={aoCriarDesafio}>
            <label className="campo">
              <span className="campo__rotulo">Nome</span>
              <input className="campo__entrada" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={80} />
            </label>
            <div className="lado-a-lado">
              <label className="campo">
                <span className="campo__rotulo">Começa</span>
                <input className="campo__entrada" type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
              </label>
              <label className="campo">
                <span className="campo__rotulo">Acaba</span>
                <input className="campo__entrada" type="date" value={fim} onChange={(e) => setFim(e.target.value)} />
              </label>
            </div>
            {erro && (
              <p className="erro" role="alert">
                {erro}
              </p>
            )}
            <button className="botao" type="submit" disabled={enviando || !nome.trim()}>
              {enviando ? "Criando…" : "Criar desafio"}
            </button>
          </form>
        )}

        {desafios.dados?.length === 0 && !criando && (
          <p className="apagado">Nenhum desafio neste grupo ainda.</p>
        )}
        <ul className="lista">
          {desafios.dados?.map((d) => (
            <li key={d.id}>
              <Link to={`/desafios/${d.id}`} className={`cartao-desafio cartao-desafio--${d.status.toLowerCase()}`}>
                <span className={`selo selo--${d.status.toLowerCase()}`}>{STATUS_DESAFIO[d.status]}</span>
                <span className="cartao-desafio__nome">{d.nome}</span>
                <span className="cartao-desafio__detalhe">{descreverPrazo(d.dataInicio, d.dataFim)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
