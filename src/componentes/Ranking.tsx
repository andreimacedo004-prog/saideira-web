import { useAutenticacao } from "../auth/AuthContext";
import { plural } from "../rotulos";
import type { PosicaoRanking, Regras } from "../tipos";
import Avatar from "./Avatar";

const MEDALHAS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

function detalhar(p: PosicaoRanking): string {
  const partes = [plural(p.checkIns, "rolê", "rolês")];
  if (p.cervejasNovas > 0) partes.push(plural(p.cervejasNovas, "cerveja nova", "cervejas novas"));
  if (p.lugaresNovos > 0) partes.push(plural(p.lugaresNovos, "lugar novo", "lugares novos"));
  if (p.amigosMarcados > 0) partes.push(plural(p.amigosMarcados, "amigo marcado", "amigos marcados"));
  return partes.join(" · ");
}

export default function Ranking({ posicoes, regras }: { posicoes: PosicaoRanking[]; regras: Regras | null }) {
  const { usuario } = useAutenticacao();

  return (
    <div>
      <ol className="ranking">
        {posicoes.map((p) => {
          const eu = p.usuario.id === usuario?.id;
          return (
            <li key={p.usuario.id} className={eu ? "posicao posicao--eu" : "posicao"}>
              <span className="posicao__numero">{MEDALHAS[p.posicao] ?? `${p.posicao}º`}</span>
              <Avatar usuario={p.usuario} tamanho={40} />
              <div className="posicao__quem">
                <p className="posicao__nome">
                  {p.usuario.nome}
                  {eu && <span className="apagado"> (você)</span>}
                </p>
                <p className="posicao__detalhe">{p.checkIns > 0 ? detalhar(p) : "ainda não saiu de casa"}</p>
              </div>
              <span className="posicao__pontos">{p.pontos}</span>
            </li>
          );
        })}
      </ol>

      {regras && (
        <details className="regras">
          <summary>Como pontuar</summary>
          <ul>
            <li>
              <strong>+{regras.pontosPorCheckIn}</strong> por check-in
            </li>
            <li>
              <strong>+{regras.pontosPorCervejaNova}</strong> por cerveja que você ainda não tinha registrado no desafio
            </li>
            <li>
              <strong>+{regras.pontosPorAmigoMarcado}</strong> por amigo marcado
            </li>
            <li>
              <strong>+{regras.pontosPorLugarNovo}</strong> por lugar onde você ainda não tinha feito check-in
            </li>
          </ul>
          <p className="apagado pequeno">
            Um check-in a cada {regras.intervaloMinimoMinutos / 60}h, no máximo {regras.maxCervejasPorCheckIn} cervejas
            por check-in, e dá para registrar rolês de até {regras.maxHorasRetroativo}h atrás. Conta variedade e
            galera, não quantidade de bebida.
          </p>
        </details>
      )}
    </div>
  );
}
