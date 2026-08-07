/** 숫자·날짜 표기 유틸. 통화는 KRW 원 단위. */

const nf = new Intl.NumberFormat("ko-KR");

export function num(v: number, digits = 0): string {
  return v.toLocaleString("ko-KR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function won(v: number): string {
  return `${nf.format(Math.round(v))}원`;
}

/** 대시보드용 축약 표기: 1,284 / 12.9만 / 4.2억 */
export function compactWon(v: number): string {
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (abs >= 1_0000_0000) return `${sign}${(abs / 1_0000_0000).toFixed(abs >= 10_0000_0000 ? 0 : 1)}억`;
  if (abs >= 1_0000) return `${sign}${(abs / 1_0000).toFixed(abs >= 10_0000 ? 0 : 1)}만`;
  return `${sign}${nf.format(Math.round(abs))}`;
}

/** 축 눈금용 — 단위 접미사만 붙인 짧은 표기 */
export function axisWon(v: number): string {
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (abs >= 1_0000_0000) return `${sign}${(abs / 1_0000_0000).toFixed(abs >= 10_0000_0000 ? 0 : 1)}억`;
  if (abs >= 1_0000) return `${sign}${Math.round(abs / 1_0000)}만`;
  return `${sign}${nf.format(abs)}`;
}

export function pct(v: number, digits = 1): string {
  return `${(v * 100).toFixed(digits)}%`;
}

export function signedPct(v: number, digits = 1): string {
  const s = (v * 100).toFixed(digits);
  return `${v > 0 ? "+" : ""}${s}%`;
}

export function shortDate(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${Number(m)}/${Number(d)}`;
}

export function koDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${y}. ${Number(m)}. ${Number(d)}.`;
}
