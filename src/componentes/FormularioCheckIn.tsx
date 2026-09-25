import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAutenticacao } from "../auth/AuthContext";
import { editarCheckIn } from "../api/checkins";
import { mensagemDeErro } from "../api/client";
import { buscarDesafio, fazerCheckIn, feed, regras as buscarRegras } from "../api/desafios";
import { buscarGrupo } from "../api/grupos";
import Avatar from "./Avatar";
import SeletorDeCervejas, { type CervejaEscolhida } from "./SeletorDeCervejas";
import { enviarFoto, fotoOtimizada, fotosAtivas } from "../fotos";
import { useRequisicao } from "../ganchos/useRequisicao";
import { FORMATOS_PADRAO, TIPOS_DE_ROLE } from "../rotulos";
import { paraDataHoraLocal } from "../tempo";
import type { CheckInParaEditar, TipoRole } from "../tipos";

interface Props {
  desafioId: number;
  /** Com isto, a tela vira "Editar check-in", ja preenchida. */
  edicao?: CheckInParaEditar;
}

/** "sabado, 07/11 as 23:10" */
function descreverHorario(dataHoraIso: string) {
  const data = new Date(dataHoraIso);
  const dia = data.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit" });
  const hora = data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return `${dia} às ${hora}`;
}

/**
 * A tela do check-in, para fazer um novo ou editar um que ja existe.
 * Na edicao o horario fica como estava (a regra das 2h depende dele).
 */
export default function FormularioCheckIn({ desafioId, edicao }: Props) {
  const navegar = useNavigate();
  const { usuario } = useAutenticacao();
  const editando = edicao !== undefined;

  const desafio = useRequisicao(() => buscarDesafio(desafioId), desafioId);
  const grupoId = desafio.dados?.grupoId;
  const grupo = useRequisicao(
    () => (grupoId ? buscarGrupo(grupoId) : Promise.resolve(null)),
    grupoId,
  );
  const checkInsAnteriores = useRequisicao(() => feed(desafioId), desafioId);
  const regras = useRequisicao(buscarRegras);

  // Foto nova escolhida agora (e a previa dela) ou a que o check-in ja tinha
  const [foto, setFoto] = useState<File | null>(null);
  const [previa, setPrevia] = useState<string | null>(null);
  const [fotoAtual, setFotoAtual] = useState<string | null>(edicao?.fotoUrl ?? null);

  const [tipo, setTipo] = useState<TipoRole>(edicao?.tipo ?? "BAR");
  const [local, setLocal] = useState(edicao?.local ?? "");
  const [amigos, setAmigos] = useState<number[]>(edicao?.amigosIds ?? []);
  const [cervejas, setCervejas] = useState<CervejaEscolhida[]>(
    () => edicao?.cervejas.map((c) => ({ cerveja: c.cerveja, formato: c.formato, quantidade: c.quantidade })) ?? [],
  );
  const [legenda, setLegenda] = useState(edicao?.legenda ?? "");
  const [foiMaisCedo, setFoiMaisCedo] = useState(false);
  const [feitoEm, setFeitoEm] = useState(() => paraDataHoraLocal(new Date()));

  const [etapa, setEtapa] = useState<"preenchendo" | "enviando-foto" | "salvando">("preenchendo");
  const [erro, setErro] = useState<string | null>(null);

  // Libera a memoria da previa quando a foto muda ou a tela fecha
  useEffect(() => {
    if (!previa) return;
    return () => URL.revokeObjectURL(previa);
  }, [previa]);

  // Lugares ja usados no desafio: sugerir o mesmo nome faz o bonus de
  // "lugar novo" funcionar direito ("Bar do Zé" e nao "bar do zé centro")
  const lugaresConhecidos = useMemo(() => {
    const nomes = new Set<string>();
    checkInsAnteriores.dados?.forEach((c) => nomes.add(c.local));
    return [...nomes];
  }, [checkInsAnteriores.dados]);

  const outrosMembros = (grupo.dados?.membros ?? []).filter((m) => m.id !== usuario?.id);
  const maxCervejas = regras.dados?.maxCervejasPorCheckIn ?? 5;
  const formatos = regras.dados?.formatos ?? FORMATOS_PADRAO;
  const horasRetroativo = regras.dados?.maxHorasRetroativo ?? 24;

  function escolherFoto(evento: ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    if (!arquivo) return;
    setFoto(arquivo);
    setPrevia(URL.createObjectURL(arquivo));
  }

  function tirarFoto() {
    setFoto(null);
    setPrevia(null);
    setFotoAtual(null);
  }

  function alternarAmigo(id: number) {
    setAmigos((atual) => (atual.includes(id) ? atual.filter((a) => a !== id) : [...atual, id]));
  }

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    if (!local.trim()) {
      setErro("Onde foi o rolê?");
      return;
    }
    setErro(null);

    try {
      let fotoUrl: string | undefined = fotoAtual ?? undefined;
      if (foto) {
        setEtapa("enviando-foto");
        fotoUrl = await enviarFoto(foto);
      }

      setEtapa("salvando");
      // Quem saiu do grupo depois do role nao aparece para marcar: sai da marcacao
      const membros = grupo.dados ? new Set(outrosMembros.map((m) => m.id)) : null;
      const dados = {
        tipo,
        local: local.trim(),
        fotoUrl,
        legenda: legenda.trim() || undefined,
        amigosIds: membros ? amigos.filter((id) => membros.has(id)) : amigos,
        cervejas: cervejas.map((c) => ({ cervejaId: c.cerveja.id, formato: c.formato, quantidade: c.quantidade })),
      };

      if (edicao) {
        const atualizado = await editarCheckIn(edicao.id, dados);
        navegar(`/desafios/${desafioId}`, {
          replace: true,
          state: { pontosGanhos: atualizado.pontos.total, editado: true },
        });
      } else {
        const criado = await fazerCheckIn(desafioId, { ...dados, feitoEm: foiMaisCedo ? feitoEm : undefined });
        navegar(`/desafios/${desafioId}`, { replace: true, state: { pontosGanhos: criado.pontos.total } });
      }
    } catch (problema) {
      setErro(mensagemDeErro(problema));
      setEtapa("preenchendo");
    }
  }

  if (desafio.erro) return <p className="erro pagina">{desafio.erro}</p>;
  if (!desafio.dados) return <p className="apagado pagina">Carregando…</p>;

  const agora = new Date();
  const limiteRetroativo = new Date(agora.getTime() - horasRetroativo * 3_600_000);
  const ocupado = etapa !== "preenchendo";
  const imagem = previa ?? (fotoAtual ? fotoOtimizada(fotoAtual, 900) : null);

  return (
    <form className="pagina checkin-form" onSubmit={aoEnviar}>
      <Link to={`/desafios/${desafioId}`} className="voltar">
        ← {desafio.dados.nome}
      </Link>
      <h1 className="titulo">{editando ? "Editar check-in" : "Check-in"}</h1>

      {fotosAtivas ? (
        <>
          <label className={imagem ? "foto-campo foto-campo--com-foto" : "foto-campo"}>
            {imagem ? <img src={imagem} alt="Foto do rolê" /> : <span>📸 Tirar ou escolher foto</span>}
            <input type="file" accept="image/*" capture="environment" onChange={escolherFoto} hidden />
          </label>
          {imagem && (
            <p className="foto-acoes">
              <span className="apagado pequeno">Toque na foto para trocar</span>
              <button type="button" className="link link--perigo" onClick={tirarFoto}>
                Tirar foto
              </button>
            </p>
          )}
        </>
      ) : (
        <p className="aviso pequeno">
          Fotos desligadas: configure o Cloudinary no <code>.env.local</code> (veja o README).
        </p>
      )}

      <fieldset className="grupo-campos">
        <legend className="campo__rotulo">Que rolê foi?</legend>
        <div className="tipos">
          {TIPOS_DE_ROLE.map((t) => (
            <button
              type="button"
              key={t.valor}
              className={tipo === t.valor ? "tipo tipo--ativo" : "tipo"}
              aria-pressed={tipo === t.valor}
              onClick={() => setTipo(t.valor)}
            >
              <span className="tipo__emoji" aria-hidden="true">
                {t.emoji}
              </span>
              {t.rotulo}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="campo">
        <span className="campo__rotulo">Onde?</span>
        <input
          className="campo__entrada"
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          placeholder="Bar do Zé, casa da Bia…"
          list="lugares-conhecidos"
          maxLength={120}
          required
        />
        <datalist id="lugares-conhecidos">
          {lugaresConhecidos.map((l) => (
            <option key={l} value={l} />
          ))}
        </datalist>
      </label>

      {outrosMembros.length > 0 && (
        <fieldset className="grupo-campos">
          <legend className="campo__rotulo">Com quem? (+3 cada)</legend>
          <div className="amigos">
            {outrosMembros.map((m) => {
              const marcado = amigos.includes(m.id);
              return (
                <button
                  type="button"
                  key={m.id}
                  className={marcado ? "amigo amigo--marcado" : "amigo"}
                  aria-pressed={marcado}
                  onClick={() => alternarAmigo(m.id)}
                >
                  <Avatar usuario={m} tamanho={40} />
                  <span>{m.nome.split(" ")[0]}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <fieldset className="grupo-campos">
        <legend className="campo__rotulo">Cervejas (+5 cada uma nova pra você)</legend>
        <SeletorDeCervejas selecionadas={cervejas} aoMudar={setCervejas} maximo={maxCervejas} formatos={formatos} />
      </fieldset>

      <label className="campo">
        <span className="campo__rotulo">Legenda</span>
        <textarea
          className="campo__entrada"
          value={legenda}
          onChange={(e) => setLegenda(e.target.value)}
          rows={2}
          maxLength={500}
          placeholder="Só mais uma…"
        />
      </label>

      {edicao ? (
        <p className="apagado pequeno checkin-form__horario">
          Rolê de {descreverHorario(edicao.feitoEm)}. O horário não muda na edição.
        </p>
      ) : (
        <>
          <label className="caixa">
            <input type="checkbox" checked={foiMaisCedo} onChange={(e) => setFoiMaisCedo(e.target.checked)} />
            <span>Esqueci de registrar na hora</span>
          </label>
          {foiMaisCedo && (
            <label className="campo">
              <span className="campo__rotulo">Quando foi? (até {horasRetroativo}h atrás)</span>
              <input
                className="campo__entrada"
                type="datetime-local"
                value={feitoEm}
                min={paraDataHoraLocal(limiteRetroativo)}
                max={paraDataHoraLocal(agora)}
                onChange={(e) => setFeitoEm(e.target.value)}
              />
            </label>
          )}
        </>
      )}

      {erro && (
        <p className="erro" role="alert">
          {erro}
        </p>
      )}

      <button className="botao botao--largo botao--grande" type="submit" disabled={ocupado}>
        {etapa === "enviando-foto"
          ? "Enviando foto…"
          : etapa === "salvando"
            ? "Salvando…"
            : editando
              ? "Salvar alterações"
              : "Fazer check-in 🍻"}
      </button>
    </form>
  );
}
