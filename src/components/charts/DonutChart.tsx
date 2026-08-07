"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { fmt, SERIES, TooltipRow, TooltipShell, type FormatKey } from "./theme";
import { pct } from "@/lib/format";

export type Slice = { key: string; value: number; color?: string };

/**
 * 도넛 — 부분/전체 비중 3~6조각까지만. 조각 사이는 표면색 2px 간격.
 * 가운데에는 합계(히어로 값)를 둔다.
 */
export function DonutChart({
  data,
  height = 240,
  centerLabel,
  centerValue,
  valueFormat = "compactWon",
  tooltipFormat = "won",
}: {
  data: Slice[];
  height?: number;
  centerLabel?: string;
  centerValue?: string;
  valueFormat?: FormatKey;
  tooltipFormat?: FormatKey;
}) {
  const sum = data.reduce((acc, d) => acc + d.value, 0);
  const formatValue = fmt(valueFormat);
  const formatTooltip = fmt(tooltipFormat);
  const colored = data.map((d, i) => ({ ...d, color: d.color ?? SERIES[i % SERIES.length] }));

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative shrink-0" style={{ width: height, height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={colored}
              dataKey="value"
              nameKey="key"
              innerRadius="62%"
              outerRadius="92%"
              paddingAngle={2}
              stroke="var(--surface)"
              strokeWidth={2}
              startAngle={90}
              endAngle={-270}
              isAnimationActive={false}
            >
              {colored.map((d) => (
                <Cell key={d.key} fill={d.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0];
                const value = Number(p.value ?? 0);
                return (
                  <TooltipShell title={String(p.name)}>
                    <TooltipRow
                      color={(p.payload as Slice).color}
                      label="금액"
                      value={formatTooltip(value)}
                    />
                    <TooltipRow label="비중" value={pct(sum ? value / sum : 0)} muted />
                  </TooltipShell>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        {centerValue ? (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            {centerLabel ? (
              <span className="text-[11px] text-ink-muted">{centerLabel}</span>
            ) : null}
            <span className="text-xl font-semibold tracking-tight text-ink">{centerValue}</span>
          </div>
        ) : null}
      </div>

      {/* 범례가 곧 값 표(색 대비 완화 경로) */}
      <ul className="min-w-0 flex-1 space-y-1.5">
        {colored.map((d) => (
          <li key={d.key} className="flex items-center gap-2 text-sm">
            <span
              className="size-2.5 shrink-0 rounded-[3px]"
              style={{ background: d.color }}
              aria-hidden
            />
            <span className="min-w-0 flex-1 truncate text-ink-secondary">{d.key}</span>
            <span className="tabular-nums text-ink">{formatValue(d.value)}</span>
            <span className="w-12 text-right tabular-nums text-ink-muted">
              {pct(sum ? d.value / sum : 0, 1)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
