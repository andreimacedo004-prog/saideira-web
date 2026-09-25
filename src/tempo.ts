/**
 * Datas e horarios. Regra pura, sem React, para ser facil de conferir.
 *
 * O backend manda horarios sem fuso ("2026-11-06T23:30:00") ja no horario
 * de Brasilia. O navegador interpreta texto sem fuso como horario local,
 * entao para quem esta no Brasil a conta fecha sem conversao.
 */

const UM_MINUTO = 60_000;
const UMA_HORA = 60 * UM_MINUTO;

/**
 * "2026-11-01" -> Date na meia-noite LOCAL.
 * new Date("2026-11-01") seria meia-noite em UTC, que no Brasil
 * ainda e 31/10 as 21h — o desafio apareceria comecando um dia antes.
 */
export function lerData(dataIso: string): Date {
  const [ano, mes, dia] = dataIso.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}

function doisDigitos(n: number) {
  return String(n).padStart(2, "0");
}

/** Date -> "2026-11-01" (no horario local) */
export function paraDataIso(data: Date): string {
  return `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}-${doisDigitos(data.getDate())}`;
}

/** Date -> "2026-11-06T23:30", o formato do <input type="datetime-local"> e do backend */
export function paraDataHoraLocal(data: Date): string {
  return `${paraDataIso(data)}T${doisDigitos(data.getHours())}:${doisDigitos(data.getMinutes())}`;
}

/** "2026-11-01" -> "01/11" */
export function formatarDiaMes(dataIso: string): string {
  return lerData(dataIso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

/** Feed: "agora", "há 12 min", "há 3 h", "ontem, 23:10", "sex, 06/11 · 23:10" */
export function tempoRelativo(dataHoraIso: string, agora = new Date()): string {
  const quando = new Date(dataHoraIso);
  const diferenca = agora.getTime() - quando.getTime();
  const hora = `${doisDigitos(quando.getHours())}:${doisDigitos(quando.getMinutes())}`;

  if (diferenca < UM_MINUTO) return "agora";
  if (diferenca < UMA_HORA) return `há ${Math.floor(diferenca / UM_MINUTO)} min`;

  const ontem = new Date(agora);
  ontem.setDate(agora.getDate() - 1);
  const mesmoDia = (a: Date, b: Date) => paraDataIso(a) === paraDataIso(b);

  if (mesmoDia(quando, agora)) return `há ${Math.floor(diferenca / UMA_HORA)} h`;
  if (mesmoDia(quando, ontem)) return `ontem, ${hora}`;

  const dia = quando.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });
  return `${dia.replace(".", "")} · ${hora}`;
}

/** Dias inteiros entre hoje e uma data (positivo = no futuro). */
export function diasAte(dataIso: string, hoje = new Date()): number {
  const alvo = lerData(dataIso);
  const inicioDeHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  return Math.round((alvo.getTime() - inicioDeHoje.getTime()) / (24 * UMA_HORA));
}

/** Texto curto sobre o prazo do desafio, para os cards. */
export function descreverPrazo(dataInicio: string, dataFim: string, hoje = new Date()): string {
  const paraComecar = diasAte(dataInicio, hoje);
  if (paraComecar > 0) return paraComecar === 1 ? "começa amanhã" : `começa em ${paraComecar} dias`;

  const paraAcabar = diasAte(dataFim, hoje);
  if (paraAcabar < 0) return `acabou em ${formatarDiaMes(dataFim)}`;
  if (paraAcabar === 0) return "último dia!";
  if (paraAcabar === 1) return "acaba amanhã";
  return `faltam ${paraAcabar} dias`;
}
