import { retrospectiva } from "../api/desafios";
import { useRequisicao } from "../ganchos/useRequisicao";
import { plural } from "../rotulos";

/** 2.4 -> "2,4" · 12 -> "12" · 1234.5 -> "1.234,5" */
function litros(valor: number) {
  return valor.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
}

/** "4 unidades · 2 cervejas diferentes": a linha so quebra entre as partes. */
function Partes({ itens }: { itens: string[] }) {
  return itens.map((texto, i) => (
    <span key={i}>
      {i > 0 && " · "}
      <span className="resumo__parte">{texto}</span>
    </span>
  ));
}

/**
 * A "soma escondida" do desafio, so para quem esta logado.
 * O backend devolve o volume da propria pessoa e o total da galera;
 * o de cada amigo nunca sai do servidor.
 *
 * Monta so quando a aba abre, entao cada abertura busca os numeros de novo.
 */
export default function MeuResumo({ desafioId }: { desafioId: number }) {
  const resumo = useRequisicao(() => retrospectiva(desafioId), desafioId);

  if (resumo.erro) return <p className="erro">{resumo.erro}</p>;
  if (!resumo.dados) return <p className="apagado">Carregando…</p>;

  const { eu, grupo, minhasCervejas } = resumo.dados;

  return (
    <div className="resumo">
      <p className="resumo__privado">🔒 Só você vê esta aba</p>

      {eu.unidades === 0 ? (
        <div className="vazio">
          <p className="vazio__emoji">🍺</p>
          <p>Nada somado ainda.</p>
          <p className="apagado">
            Quando você marcar cervejas no check-in, o formato e a quantidade de cada uma viram litros aqui.
          </p>
        </div>
      ) : (
        <>
          <div className="resumo__destaque">
            <p className="resumo__rotulo">Você neste desafio</p>
            <p className="resumo__litros">
              {litros(eu.litros)} <span>L</span>
            </p>
            <p className="apagado">
              <Partes
                itens={[
                  plural(eu.unidades, "unidade", "unidades"),
                  plural(eu.cervejasDiferentes, "cerveja diferente", "cervejas diferentes"),
                  plural(eu.roles, "rolê", "rolês"),
                ]}
              />
            </p>
          </div>

          <h2 className="secao__titulo resumo__titulo">Suas cervejas</h2>
          <ol className="resumo__cervejas">
            {minhasCervejas.map((item) => (
              <li key={item.cerveja.id} className="resumo__cerveja">
                <span className="resumo__nome">{item.cerveja.nome}</span>
                <span className="resumo__quanto">
                  {plural(item.unidades, "unidade", "unidades")} · {litros(item.litros)} L
                </span>
              </li>
            ))}
          </ol>
        </>
      )}

      <div className="resumo__galera">
        <h2 className="secao__titulo">A galera toda</h2>
        {grupo.unidades === 0 ? (
          <p className="apagado">Ninguém marcou cerveja ainda.</p>
        ) : (
          <p>
            <strong>{litros(grupo.litros)} L</strong> em{" "}
            <Partes
              itens={[
                plural(grupo.roles, "rolê", "rolês"),
                plural(grupo.cervejasDiferentes, "cerveja diferente", "cervejas diferentes"),
              ]}
            />
          </p>
        )}
        <p className="apagado pequeno">Só o total do grupo. O de cada um fica com cada um.</p>
      </div>

      <p className="apagado pequeno resumo__nota">
        Os litros saem do formato marcado no check-in (lata 350 ml, garrafa 600 ml…). Não valem ponto e não aparecem
        no feed nem no ranking.
      </p>
    </div>
  );
}
