"use client";

import type { ReactNode } from "react";
import { axisWon, compactWon, num, pct, shortDate, won } from "@/lib/format";

/**
 * 서버 컴포넌트에서 클라이언트 차트로 함수를 넘길 수 없으므로,
 * 포맷터는 문자열 토큰으로 지정하고 클라이언트에서 해석한다.
 */
export type FormatKey =
  | "won"
  | "compactWon"
  | "axisWon"
  | "count"
  | "people"
  | "hours"
  | "number"
  | "percent";

const FORMATTERS: Record<FormatKey, (v: number) => string> = {
  won: (v) => won(v),
  compactWon: (v) => `${compactWon(v)}원`,
  axisWon: (v) => axisWon(v),
  count: (v) => `${num(v)}건`,
  people: (v) => `${num(v)}명`,
  hours: (v) => `${num(v)}시간`,
  number: (v) => num(v),
  percent: (v) => pct(v),
};

export function fmt(key: FormatKey): (v: number) => string {
  return FORMATTERS[key];
}

export type XFormatKey = "none" | "shortDate";

export function xfmt(key: XFormatKey): (v: string) => string {
  return key === "shortDate" ? shortDate : (v: string) => v;
}

/** 카테고리 색 슬롯 — 고정 순서로만 배정한다(순환·재배치 금지). */
export const SERIES = [
  "var(--series-1)",
  "var(--series-2)",
  "var(--series-3)",
  "var(--series-4)",
  "var(--series-5)",
  "var(--series-6)",
  "var(--series-7)",
  "var(--series-8)",
] as const;

/** 순차(단일 색상) 램프 — 크기를 나타낼 때 */
export const SEQUENTIAL = [
  "var(--seq-1)",
  "var(--seq-2)",
  "var(--seq-3)",
  "var(--seq-4)",
  "var(--seq-5)",
  "var(--seq-6)",
] as const;

export const STATUS = {
  good: "var(--good)",
  warning: "var(--warning)",
  serious: "var(--serious)",
  critical: "var(--critical)",
} as const;

export const AXIS_TICK = {
  fontSize: 11,
  fill: "var(--ink-muted)",
} as const;

export const GRID_PROPS = {
  stroke: "var(--grid)",
  strokeWidth: 1,
} as const;

/** 마크 두께 상한 — 슬롯을 꽉 채우지 않고 여백을 남긴다. */
export const MAX_BAR = 24;

export function TooltipShell({
  title,
  children,
}: {
  title?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="pointer-events-none min-w-40 rounded-lg border border-line-strong bg-surface px-3 py-2 text-xs shadow-lg">
      {title ? <p className="mb-1.5 font-semibold text-ink">{title}</p> : null}
      <div className="space-y-1">{children}</div>
    </div>
  );
}

export function TooltipRow({
  color,
  label,
  value,
  muted = false,
}: {
  color?: string;
  label: ReactNode;
  value: ReactNode;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="flex items-center gap-1.5 text-ink-secondary">
        {color ? (
          <span
            className="size-2 shrink-0 rounded-[2px]"
            style={{ background: color }}
            aria-hidden
          />
        ) : null}
        {label}
      </span>
      <span className={`tabular-nums ${muted ? "text-ink-muted" : "font-medium text-ink"}`}>
        {value}
      </span>
    </div>
  );
}

/** 범례 — 2개 이상 시리즈에는 항상 붙인다. 색만으로 정체성을 전달하지 않기 위함. */
export function Legend({
  items,
  className = "",
}: {
  items: { label: string; color: string; value?: string }[];
  className?: string;
}) {
  return (
    <ul className={`flex flex-wrap items-center gap-x-4 gap-y-1.5 ${className}`}>
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5 text-xs text-ink-secondary">
          <span
            className="size-2 shrink-0 rounded-[2px]"
            style={{ background: item.color }}
            aria-hidden
          />
          <span>{item.label}</span>
          {item.value ? <span className="tabular-nums text-ink-muted">{item.value}</span> : null}
        </li>
      ))}
    </ul>
  );
}
