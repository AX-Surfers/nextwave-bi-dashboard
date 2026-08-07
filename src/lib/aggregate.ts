/** 집계 헬퍼 — 화면 어디서든 재사용하는 순수 함수 모음. */

export type Bucket = { key: string; value: number; count: number };

/** key 기준 합계 + 건수. 기본은 값 내림차순. */
export function sumBy<T>(
  rows: T[],
  keyFn: (row: T) => string,
  valFn: (row: T) => number,
  sort: "desc" | "asc" | "none" = "desc",
): Bucket[] {
  const map = new Map<string, Bucket>();
  for (const row of rows) {
    const key = keyFn(row);
    const hit = map.get(key);
    if (hit) {
      hit.value += valFn(row);
      hit.count += 1;
    } else {
      map.set(key, { key, value: valFn(row), count: 1 });
    }
  }
  const out = [...map.values()];
  if (sort === "desc") out.sort((a, b) => b.value - a.value);
  if (sort === "asc") out.sort((a, b) => a.value - b.value);
  return out;
}

export function countBy<T>(rows: T[], keyFn: (row: T) => string): Bucket[] {
  return sumBy(rows, keyFn, () => 1);
}

/** 정해진 순서(order)대로 정렬 — 파이프라인 단계, 채권 연령구간처럼 순서가 의미를 갖는 축. */
export function orderBuckets(buckets: Bucket[], order: readonly string[]): Bucket[] {
  const map = new Map(buckets.map((b) => [b.key, b]));
  return order.map((key) => map.get(key) ?? { key, value: 0, count: 0 });
}

export function total<T>(rows: T[], valFn: (row: T) => number): number {
  return rows.reduce((acc, row) => acc + valFn(row), 0);
}

export function mean<T>(rows: T[], valFn: (row: T) => number): number {
  return rows.length ? total(rows, valFn) / rows.length : 0;
}

/** 전기 대비 증감률. 분모가 0이면 0. */
export function growth(current: number, previous: number): number {
  return previous ? (current - previous) / Math.abs(previous) : 0;
}

/** 상위 n개 + 나머지를 '기타'로 묶는다 (카테고리 색상 슬롯 8개 상한 대응). */
export function topNWithOther(buckets: Bucket[], n: number, label = "기타"): Bucket[] {
  if (buckets.length <= n) return buckets;
  const head = buckets.slice(0, n);
  const rest = buckets.slice(n);
  return [
    ...head,
    {
      key: label,
      value: rest.reduce((a, b) => a + b.value, 0),
      count: rest.reduce((a, b) => a + b.count, 0),
    },
  ];
}

/** 일자별 시계열(빈 날짜 없이 원본에 있는 날짜만) */
export function byDate<T>(
  rows: T[],
  dateFn: (row: T) => string,
  valFn: (row: T) => number,
): { date: string; value: number; count: number }[] {
  return sumBy(rows, dateFn, valFn, "none")
    .map((b) => ({ date: b.key, value: b.value, count: b.count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function runningTotal<T extends { value: number }>(rows: T[]): (T & { cumulative: number })[] {
  return rows.reduce<(T & { cumulative: number })[]>((acc, row) => {
    const prev = acc.length ? acc[acc.length - 1].cumulative : 0;
    acc.push({ ...row, cumulative: prev + row.value });
    return acc;
  }, []);
}

/** 기초 잔액에서 시작해 일자별 순증감을 누적한 잔액 시계열. */
export function balanceSeries(
  netByDate: { date: string; value: number }[],
  opening: number,
): { date: string; value: number }[] {
  return netByDate.reduce<{ date: string; value: number }[]>((acc, row) => {
    const prev = acc.length ? acc[acc.length - 1].value : opening;
    acc.push({ date: row.date, value: prev + row.value });
    return acc;
  }, []);
}
