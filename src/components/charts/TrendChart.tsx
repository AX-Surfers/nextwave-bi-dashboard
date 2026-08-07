"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AXIS_TICK,
  fmt,
  GRID_PROPS,
  Legend,
  SERIES,
  TooltipRow,
  TooltipShell,
  xfmt,
  type FormatKey,
  type XFormatKey,
} from "./theme";

export type TrendSeries = {
  key: string;
  label: string;
  /** 면(누적/단일 강조) 또는 선 */
  kind?: "area" | "line";
};

type Row = Record<string, string | number>;

/**
 * 시계열(추이) 차트. 면은 시리즈 색 워시, 선은 2px.
 * 크로스헤어 + 툴팁은 기본 탑재.
 */
export function TrendChart({
  data,
  series,
  xKey = "date",
  xFormat = "none",
  valueFormat = "axisWon",
  tooltipFormat = "won",
  height = 260,
  stacked = false,
  showLegend,
  baseline = "zero",
}: {
  data: Row[];
  series: TrendSeries[];
  xKey?: string;
  xFormat?: XFormatKey;
  valueFormat?: FormatKey;
  tooltipFormat?: FormatKey;
  height?: number;
  stacked?: boolean;
  showLegend?: boolean;
  /** 면(면적)은 0 기준선이 필수. 잔액처럼 0에서 시작하지 않는 선은 "auto". */
  baseline?: "zero" | "auto";
}) {
  const legendVisible = showLegend ?? series.length > 1;
  const formatX = xfmt(xFormat);
  const formatValue = fmt(valueFormat);
  const formatTooltip = fmt(tooltipFormat);

  return (
    <div>
      {legendVisible ? (
        <Legend
          className="mb-3"
          items={series.map((s, i) => ({ label: s.label, color: SERIES[i % SERIES.length] }))}
        />
      ) : null}
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            {series.map((s, i) => (
              // 단일/중첩 면은 옅은 워시, 누적 면은 밴드가 구분되도록 진하게
              <linearGradient key={s.key} id={`fill-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={SERIES[i % SERIES.length]}
                  stopOpacity={stacked ? 0.7 : 0.16}
                />
                <stop
                  offset="100%"
                  stopColor={SERIES[i % SERIES.length]}
                  stopOpacity={stacked ? 0.5 : 0.04}
                />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid {...GRID_PROPS} vertical={false} />
          <XAxis
            dataKey={xKey}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={{ stroke: "var(--axis)" }}
            tickFormatter={formatX}
            minTickGap={18}
          />
          <YAxis
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={52}
            tickFormatter={formatValue}
            domain={baseline === "auto" ? ["dataMin", "dataMax"] : [0, "auto"]}
          />
          <Tooltip
            cursor={{ stroke: "var(--axis)", strokeWidth: 1 }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <TooltipShell title={formatX(String(label))}>
                  {payload.map((entry) => (
                    <TooltipRow
                      key={String(entry.dataKey)}
                      color={entry.color}
                      label={series.find((s) => s.key === entry.dataKey)?.label ?? entry.name}
                      value={formatTooltip(Number(entry.value ?? 0))}
                    />
                  ))}
                </TooltipShell>
              );
            }}
          />
          {series.map((s, i) =>
            s.kind === "line" ? (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                stroke={SERIES[i % SERIES.length]}
                strokeWidth={2}
                strokeLinecap="round"
                dot={false}
                isAnimationActive={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--surface)" }}
              />
            ) : (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                stackId={stacked ? "stack" : undefined}
                stroke={SERIES[i % SERIES.length]}
                strokeWidth={2}
                strokeLinecap="round"
                fill={`url(#fill-${s.key})`}
                isAnimationActive={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--surface)" }}
              />
            ),
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
