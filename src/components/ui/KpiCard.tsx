import type { ReactNode } from "react";
import { signedPct } from "@/lib/format";

type Props = {
  label: string;
  value: string;
  /** 하단 보조 설명 */
  hint?: ReactNode;
  /** 전월 대비 등 증감률 (0.067 = +6.7%) */
  delta?: number;
  /** 값이 올라가는 게 좋은 지표인가 */
  upIsGood?: boolean;
  deltaLabel?: string;
  /** 좌측 강조 바 색 (시리즈 슬롯) */
  accent?: "s1" | "s2" | "s3" | "s4" | "s5" | "s6" | "critical" | "warning" | "good";
  /** 12포인트 스파크라인 */
  sparkline?: number[];
  emphasis?: boolean;
};

const ACCENT: Record<NonNullable<Props["accent"]>, string> = {
  s1: "bg-s1",
  s2: "bg-s2",
  s3: "bg-s3",
  s4: "bg-s4",
  s5: "bg-s5",
  s6: "bg-s6",
  critical: "bg-critical",
  warning: "bg-warning",
  good: "bg-good",
};

const STROKE: Record<NonNullable<Props["accent"]>, string> = {
  s1: "var(--series-1)",
  s2: "var(--series-2)",
  s3: "var(--series-3)",
  s4: "var(--series-4)",
  s5: "var(--series-5)",
  s6: "var(--series-6)",
  critical: "var(--critical)",
  warning: "var(--warning)",
  good: "var(--good)",
};

function Sparkline({ points, stroke }: { points: number[]; stroke: string }) {
  if (points.length < 2) return null;
  const w = 96;
  const h = 26;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const step = w / (points.length - 1);
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${(h - ((p - min) / span) * h).toFixed(1)}`)
    .join(" ");
  const lastX = w;
  const lastY = h - ((points[points.length - 1] - min) / span) * h;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden className="overflow-visible">
      <path d={path} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" opacity={0.45} />
      <circle cx={lastX} cy={lastY} r={3.5} fill={stroke} stroke="var(--surface)" strokeWidth={2} />
    </svg>
  );
}

export function KpiCard({
  label,
  value,
  hint,
  delta,
  upIsGood = true,
  deltaLabel = "전월 대비",
  accent = "s1",
  sparkline,
  emphasis = false,
}: Props) {
  const positive = delta !== undefined && delta > 0;
  const negative = delta !== undefined && delta < 0;
  const isGood = positive === upIsGood && delta !== 0;
  const deltaColor =
    delta === undefined || delta === 0
      ? "text-ink-muted"
      : isGood
        ? "text-[var(--delta-up)]"
        : "text-[var(--delta-down)]";

  return (
    <div className="relative overflow-hidden rounded-xl border border-line bg-surface p-4 shadow-[0_1px_2px_rgba(11,11,11,0.04)]">
      <span className={`absolute inset-y-0 left-0 w-[3px] ${ACCENT[accent]}`} aria-hidden />
      <p className="text-xs font-medium text-ink-secondary">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <p
          className={`${emphasis ? "text-[28px]" : "text-2xl"} leading-none font-semibold tracking-tight text-ink`}
        >
          {value}
        </p>
        {sparkline ? <Sparkline points={sparkline} stroke={STROKE[accent]} /> : null}
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        {delta !== undefined ? (
          <span className={`inline-flex items-center gap-1 font-medium ${deltaColor}`}>
            <span aria-hidden>{positive ? "▲" : negative ? "▼" : "—"}</span>
            {signedPct(delta)}
            <span className="font-normal text-ink-muted">{deltaLabel}</span>
          </span>
        ) : null}
        {hint ? <span className="text-ink-muted">{hint}</span> : null}
      </div>
    </div>
  );
}
