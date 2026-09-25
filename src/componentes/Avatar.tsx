import { fotoOtimizada } from "../fotos";

interface Props {
  usuario: { id: number; nome: string; fotoUrl: string | null };
  tamanho?: number;
}

/** Foto de perfil, ou as iniciais numa cor que e sempre a mesma para a mesma pessoa. */
export default function Avatar({ usuario, tamanho = 40 }: Props) {
  const estilo = { width: tamanho, height: tamanho, fontSize: tamanho * 0.4 };

  if (usuario.fotoUrl) {
    return (
      <img
        className="avatar"
        style={estilo}
        src={fotoOtimizada(usuario.fotoUrl, tamanho * 2)}
        alt=""
      />
    );
  }

  const iniciais = usuario.nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]!.toUpperCase())
    .join("");

  // Matiz derivado do id: a Bia e sempre roxa, o Caio sempre verde
  const matiz = (usuario.id * 67) % 360;

  return (
    <span
      className="avatar avatar--iniciais"
      style={{ ...estilo, background: `hsl(${matiz} 45% 32%)` }}
      aria-hidden="true"
    >
      {iniciais}
    </span>
  );
}
