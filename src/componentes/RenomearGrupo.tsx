import { useState, type FormEvent } from "react";
import { mensagemDeErro } from "../api/client";
import { renomearGrupo } from "../api/grupos";
import type { Grupo } from "../tipos";

interface Props {
  grupo: Grupo;
  aoSalvar: (grupo: Grupo) => void;
  aoFechar: () => void;
}

/** Muda o nome do grupo. Aparece para quem criou o grupo e para o admin. */
export default function RenomearGrupo({ grupo, aoSalvar, aoFechar }: Props) {
  const [nome, setNome] = useState(grupo.nome);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const nomeLimpo = nome.trim();
  const mudou = nomeLimpo !== "" && nomeLimpo !== grupo.nome;

  async function salvar(evento: FormEvent) {
    evento.preventDefault();
    if (!mudou) return;
    setErro(null);
    setSalvando(true);
    try {
      aoSalvar(await renomearGrupo(grupo.id, nomeLimpo));
    } catch (problema) {
      setErro(mensagemDeErro(problema));
      setSalvando(false);
    }
  }

  return (
    <form className="painel gerenciar" aria-label="Editar nome do grupo" onSubmit={salvar}>
      <label className="campo">
        <span className="campo__rotulo">Nome do grupo</span>
        <input
          className="campo__entrada"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          maxLength={60}
          autoFocus
        />
        <span className="campo__ajuda">Membros, convite e desafios continuam iguais.</span>
      </label>
      {erro && (
        <p className="erro" role="alert">
          {erro}
        </p>
      )}
      <div className="gerenciar__acoes">
        <button className="botao" type="submit" disabled={!mudou || salvando}>
          {salvando ? "Salvando…" : "Salvar nome"}
        </button>
        <button className="botao botao--secundario" type="button" onClick={aoFechar} disabled={salvando}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
