import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import * as admin from "../../api/admin";
import { mensagemDeErro } from "../../api/client";
import { useAutenticacao } from "../../auth/AuthContext";
import { useRequisicao } from "../../ganchos/useRequisicao";
import { descreverIntervalo, plural, STATUS_DESAFIO } from "../../rotulos";
import { formatarDiaMes } from "../../tempo";
import type { AdminPreviaExclusao, AdminUsuario } from "../../tipos";

/** "Joao Pe" -> "joao pe" (sem acento, para a busca) */
function normalizar(texto: string) {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

function formatarData(dataHoraIso: string | null) {
  if (!dataHoraIso) return "—";
  return new Date(dataHoraIso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

/**
 * /admin — so para as contas de APP_ADMIN_EMAILS.
 * O app esconde o menu para os outros, mas quem garante e o servidor (403).
 */
export default function PainelAdmin() {
  const { usuario } = useAutenticacao();
  if (!usuario?.admin) return <p className="erro pagina">Área só para admin.</p>;
  return <Painel />;
}

function Painel() {
  const [parametros, setParametros] = useSearchParams();
  const aba = parametros.get("aba") === "desafios" ? "desafios" : "contas";
  const resumo = useRequisicao(admin.resumo);

  return (
    <div className="pagina admin">
      <Link to="/" className="voltar">
        ← Início
      </Link>
      <h1 className="titulo">Admin</h1>
      <p className="apagado">Só as contas de admin veem esta área. Tudo que você faz aqui fica registrado no servidor.</p>

      {resumo.erro && <p className="erro">{resumo.erro}</p>}
      {resumo.dados && (
        <ul className="admin__numeros">
          <li>
            <strong>{resumo.dados.usuarios}</strong> contas
          </li>
          <li>
            <strong>{resumo.dados.grupos}</strong> grupos
          </li>
          <li>
            <strong>{resumo.dados.desafios}</strong> desafios
          </li>
          <li>
            <strong>{resumo.dados.checkInsUltimos7Dias}</strong> check-ins na semana
          </li>
        </ul>
      )}

      <div className="abas abas--duas" role="tablist">
        <button
          role="tab"
          aria-selected={aba === "contas"}
          className={aba === "contas" ? "aba aba--ativa" : "aba"}
          onClick={() => setParametros({}, { replace: true })}
        >
          Contas
        </button>
        <button
          role="tab"
          aria-selected={aba === "desafios"}
          className={aba === "desafios" ? "aba aba--ativa" : "aba"}
          onClick={() => setParametros({ aba: "desafios" }, { replace: true })}
        >
          Desafios
        </button>
      </div>

      {aba === "contas" ? <Contas aoMudar={resumo.recarregar} /> : <Desafios />}
    </div>
  );
}

function Contas({ aoMudar }: { aoMudar: () => void }) {
  const lista = useRequisicao(() => admin.usuarios());
  const [busca, setBusca] = useState("");

  const filtradas = useMemo(() => {
    const termo = normalizar(busca);
    if (!termo) return lista.dados ?? [];
    return (lista.dados ?? []).filter((u) => normalizar(u.nome).includes(termo) || u.email.includes(termo));
  }, [lista.dados, busca]);

  function aoExcluir(usuarioId: number) {
    lista.definir((atual) => (atual ?? []).filter((u) => u.id !== usuarioId));
    aoMudar();
  }

  return (
    <section>
      <label className="campo">
        <span className="campo__rotulo">Buscar por nome ou e-mail</span>
        <input
          className="campo__entrada"
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="bia, @gmail…"
        />
      </label>

      {lista.erro && <p className="erro">{lista.erro}</p>}
      {lista.carregando && <p className="apagado">Carregando…</p>}
      {lista.dados && (
        <p className="apagado pequeno">{plural(filtradas.length, "conta", "contas")}</p>
      )}

      <ul className="admin__lista">
        {filtradas.map((u) => (
          <CartaoConta key={u.id} conta={u} aoExcluir={aoExcluir} />
        ))}
      </ul>
    </section>
  );
}

function CartaoConta({ conta, aoExcluir }: { conta: AdminUsuario; aoExcluir: (id: number) => void }) {
  const [modo, setModo] = useState<"senha" | "excluir" | null>(null);
  const [senha, setSenha] = useState<string | null>(null);
  const [copiada, setCopiada] = useState(false);
  const [previa, setPrevia] = useState<AdminPreviaExclusao | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function fechar() {
    setModo(null);
    setSenha(null);
    setPrevia(null);
    setErro(null);
    setCopiada(false);
  }

  async function gerarSenha() {
    setErro(null);
    setOcupado(true);
    try {
      setSenha((await admin.gerarSenhaTemporaria(conta.id)).senha);
    } catch (problema) {
      setErro(mensagemDeErro(problema));
    } finally {
      setOcupado(false);
    }
  }

  async function copiar() {
    if (!senha) return;
    try {
      await navigator.clipboard.writeText(senha);
      setCopiada(true);
    } catch {
      // sem permissao de area de transferencia: a senha continua na tela
    }
  }

  async function abrirExclusao() {
    setModo("excluir");
    setErro(null);
    setOcupado(true);
    try {
      setPrevia(await admin.previaExclusao(conta.id));
    } catch (problema) {
      setErro(mensagemDeErro(problema));
    } finally {
      setOcupado(false);
    }
  }

  async function excluir() {
    setErro(null);
    setOcupado(true);
    try {
      await admin.excluirUsuario(conta.id);
      aoExcluir(conta.id);
    } catch (problema) {
      setErro(mensagemDeErro(problema));
      setOcupado(false);
    }
  }

  return (
    <li className="admin__conta">
      <div className="admin__conta-topo">
        <div>
          <p className="admin__conta-nome">
            {conta.nome} {conta.admin && <span className="selo selo--admin">admin</span>}
          </p>
          <p className="admin__conta-email">{conta.email}</p>
        </div>
        <span className="apagado pequeno">desde {formatarData(conta.criadoEm)}</span>
      </div>
      <p className="apagado pequeno admin__conta-detalhe">
        {conta.grupos.length > 0 ? conta.grupos.join(", ") : "Sem grupo"} · {plural(conta.checkIns, "check-in", "check-ins")}
      </p>

      {modo === null && (
        <div className="admin__acoes">
          <button className="link" onClick={() => setModo("senha")}>
            Senha nova
          </button>
          {!conta.admin && (
            <button className="link link--perigo" onClick={abrirExclusao}>
              Excluir conta
            </button>
          )}
        </div>
      )}

      {modo === "senha" && (
        <div className="admin__painel" role="region" aria-label={`Senha nova para ${conta.nome}`}>
          {senha ? (
            <>
              <p>
                Senha nova de <strong>{conta.nome}</strong>:
              </p>
              <p className="admin__senha">{senha}</p>
              <p className="apagado pequeno">
                Passe para a pessoa. A senha antiga deixou de valer e ela já pode entrar com esta. Ela só aparece agora.
              </p>
              <div className="gerenciar__acoes">
                <button className="botao botao--secundario" onClick={copiar}>
                  {copiada ? "Copiada ✓" : "Copiar"}
                </button>
                <button className="botao botao--secundario" onClick={fechar}>
                  Fechar
                </button>
              </div>
            </>
          ) : (
            <>
              <p>
                Gerar uma senha nova para <strong>{conta.nome}</strong>? A senha atual deixa de valer.
              </p>
              <div className="gerenciar__acoes">
                <button className="botao" onClick={gerarSenha} disabled={ocupado}>
                  {ocupado ? "Gerando…" : "Gerar senha"}
                </button>
                <button className="botao botao--secundario" onClick={fechar} disabled={ocupado}>
                  Voltar
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {modo === "excluir" && (
        <div className="admin__painel" role="alertdialog" aria-label={`Excluir a conta de ${conta.nome}`}>
          {ocupado && !previa && <p className="apagado">Vendo o que vai junto…</p>}
          {previa && (
            <>
              <p>
                <strong>Excluir a conta de {conta.nome}?</strong> Não tem como desfazer.
              </p>
              {previa.bloqueio ? (
                <p className="erro">{previa.bloqueio}</p>
              ) : (
                <ul className="admin__previa">
                  <li>
                    Somem {plural(previa.checkIns, "check-in", "check-ins")},{" "}
                    {plural(previa.comentarios, "comentário", "comentários")} e{" "}
                    {plural(previa.reacoes, "reação", "reações")} dela.
                  </li>
                  {previa.gruposRepassados.map((r) => (
                    <li key={r.grupo}>
                      O grupo “{r.grupo}” passa para {r.novoDono}.
                    </li>
                  ))}
                  {previa.gruposApagados.map((nome) => (
                    <li key={nome}>O grupo “{nome}” é apagado (só tinha ela).</li>
                  ))}
                </ul>
              )}
              <div className="gerenciar__acoes">
                {!previa.bloqueio && (
                  <button className="botao botao--perigo" onClick={excluir} disabled={ocupado}>
                    {ocupado ? "Excluindo…" : "Excluir de vez"}
                  </button>
                )}
                <button className="botao botao--secundario" onClick={fechar} disabled={ocupado}>
                  Voltar
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {erro && (
        <p className="erro pequeno" role="alert">
          {erro}
        </p>
      )}
    </li>
  );
}

function Desafios() {
  const lista = useRequisicao(admin.desafios);

  return (
    <section>
      {lista.erro && <p className="erro">{lista.erro}</p>}
      {lista.carregando && <p className="apagado">Carregando…</p>}
      {lista.dados?.length === 0 && <p className="apagado">Nenhum desafio criado ainda.</p>}
      <ul className="lista">
        {lista.dados?.map((d) => (
          <li key={d.id}>
            <Link to={`/admin/desafios/${d.id}`} className={`cartao-desafio cartao-desafio--${d.status.toLowerCase()}`}>
              <span className={`selo selo--${d.status.toLowerCase()}`}>{STATUS_DESAFIO[d.status]}</span>
              <span className="cartao-desafio__nome">{d.nome}</span>
              <span className="cartao-desafio__detalhe">
                {d.grupoNome} · {formatarDiaMes(d.dataInicio)} a {formatarDiaMes(d.dataFim)} ·{" "}
                {plural(d.membros, "pessoa", "pessoas")} · {plural(d.checkIns, "check-in", "check-ins")}
                {d.intervaloMinimoMinutos !== null && <> · ⏱ {descreverIntervalo(d.intervaloMinimoMinutos)}</>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
