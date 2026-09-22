/**
 * Datas de nota são só dia, sem hora nem fuso (coluna `date`).
 * Internamente: string ISO "AAAA-MM-DD". Na tela: "DD/MM/AAAA" (RNF004).
 * Nunca converta para Date com hora local: o fuso desloca o dia.
 */

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const BR_RE = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;

/** "2026-09-01" → "01/09/2026" */
export function formatDateBR(iso: string): string {
  const m = ISO_RE.exec(iso);
  if (!m) throw new TypeError(`Data ISO inválida: ${iso}`);
  const [, y, mo, d] = m;
  return `${d}/${mo}/${y}`;
}

/** "01/09/2026" → "2026-09-01"; null se inválida ou inexistente (ex.: 31/02). */
export function parseDateBR(input: string): string | null {
  const m = BR_RE.exec(input.trim());
  if (!m) return null;
  const d = Number(m[1]);
  const mo = Number(m[2]);
  const y = Number(m[3]);
  if (!isValidDate(y, mo, d)) return null;
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** Valida uma string ISO "AAAA-MM-DD" quanto a formato e existência do dia. */
export function isValidISODate(iso: string): boolean {
  const m = ISO_RE.exec(iso);
  if (!m) return false;
  return isValidDate(Number(m[1]), Number(m[2]), Number(m[3]));
}

/** Hoje em ISO, no fuso do servidor (suficiente para datas de nota). */
export function todayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const mo = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${mo}-${d}`;
}

function isValidDate(y: number, mo: number, d: number): boolean {
  if (mo < 1 || mo > 12 || d < 1) return false;
  const daysInMonth = new Date(Date.UTC(y, mo, 0)).getUTCDate();
  return d <= daysInMonth;
}
