/**
 * Fotos do check-in.
 *
 * O backend nao recebe arquivo: o app sobe a foto direto no Cloudinary
 * (upload "unsigned") e manda so o link para a API. Assim o servidor nao
 * gasta banda nem disco com imagem, e o plano gratis do Cloudinary sobra.
 */

const CLOUD = import.meta.env.VITE_CLOUDINARY_CLOUD;
const PRESET = import.meta.env.VITE_CLOUDINARY_PRESET;

/** Sem as duas variaveis no .env.local, o app funciona sem foto. */
export const fotosAtivas = Boolean(CLOUD && PRESET);

const LADO_MAXIMO = 1600;

/**
 * Reduz a foto antes de subir. Foto de celular tem 3–5 MB; depois disto,
 * uns 300 KB — faz diferenca no 4G do bar.
 * createImageBitmap ja respeita a rotacao (EXIF) da camera.
 */
export async function comprimir(arquivo: File): Promise<Blob> {
  const imagem = await createImageBitmap(arquivo);
  const escala = Math.min(1, LADO_MAXIMO / Math.max(imagem.width, imagem.height));
  const largura = Math.round(imagem.width * escala);
  const altura = Math.round(imagem.height * escala);

  const canvas = document.createElement("canvas");
  canvas.width = largura;
  canvas.height = altura;
  canvas.getContext("2d")!.drawImage(imagem, 0, 0, largura, altura);
  imagem.close();

  return new Promise((resolver, rejeitar) => {
    canvas.toBlob(
      (blob) => (blob ? resolver(blob) : rejeitar(new Error("Não foi possível processar a foto."))),
      "image/jpeg",
      0.82,
    );
  });
}

/** Sobe a foto e devolve a URL publica (https://res.cloudinary.com/...). */
export async function enviarFoto(arquivo: File): Promise<string> {
  if (!fotosAtivas) {
    throw new Error("Fotos não configuradas (veja VITE_CLOUDINARY_* no .env.local).");
  }

  const corpo = new FormData();
  corpo.append("file", await comprimir(arquivo), "checkin.jpg");
  corpo.append("upload_preset", PRESET!);
  corpo.append("folder", "saideira");

  const resposta = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, {
    method: "POST",
    body: corpo,
  });
  if (!resposta.ok) {
    throw new Error("Não foi possível enviar a foto. Tente de novo.");
  }
  const dados = (await resposta.json()) as { secure_url: string };
  return dados.secure_url;
}

/**
 * Pede ao Cloudinary uma versao do tamanho certo para a tela
 * (e em WebP/AVIF quando o navegador aceita). Outras URLs passam direto.
 */
export function fotoOtimizada(url: string, largura: number): string {
  const marcador = "/image/upload/";
  if (!url.includes("res.cloudinary.com") || !url.includes(marcador)) return url;
  return url.replace(marcador, `${marcador}c_limit,w_${largura},q_auto,f_auto/`);
}
