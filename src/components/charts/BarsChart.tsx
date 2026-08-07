"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
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
  MAX_BAR,
  SERIES,
  TooltipRow,
  TooltipShell,
  type FormatKey,
} from "./theme";

export type BarSeries = { key: string; label: string; color?: string };
type Row = Record<string, string | number>;

/**
 * 막대 차트 — 가로/세로, 단일/그룹/누적 모두 처리.
 * - 막대 두께 24px 상한, 데이터 끝 4px 라운드
 * - 인접·누적 막대 사이는 표면색 2px 간격으로 분리(테두리 금지)
 */
export function BarsChart({
  data,
  series,
  categoryKey = "key",
  layout = "vertical",
  stacked = false,
  height = 260,
  valueFormat = "axisWon",
  tooltipFormat = "won",
  labelFormat = "compactWon",
  categoryWidth = 96,
  showLegend,
  /** 단일 시리즈에서 막대별 색을 다르게 줄 때 (data와 같은 순서) */
  colors,
  /** 막대 끝 직접 라벨 */
  labelled = false,
}: {
  data: Row[];
  series: BarSeries[];
  categoryKey?: string;
  layout?: "vertical" | "horizontal";
  stacked?: boolean;
  height?: number;
  valueFormat?: FormatKey;
  tooltipFormat?: FormatKey;
  labelFormat?: FormatKey;
  categoryWidth?: number;
  showLegend?: boolean;
  colors?: string | string[];
  labelled?: boolean;
}) {
  // layout="vertical": 세로 막대(컬럼), "horizontal": 가로 막대
  const isColumn = layout === "vertical";
  const colorAt = (index: number) =>
    typeof colors === "string" ? colors : colors?.[index] ?? SERIES[0];
  const legendVisible = showLegend ?? series.length > 1;
  const formatValue = fmt(valueFormat);
  const formatTooltip = fmt(tooltipFormat);
  const formatLabel = fmt(labelFormat);

  return (
    <div>
      {legendVisible ? (
        <Legend
          className="mb-3"
          items={series.map((s, i) => ({
            label: s.label,
            color: s.color ?? SERIES[i % SERIES.length],
          }))}
        />
      ) : null}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          layout={isColumn ? "horizontal" : "vertical"}
          margin={{
            top: labelled && isColumn ? 20 : 8,
            right: isColumn ? 8 : labelled ? 64 : 12,
            bottom: 0,
            left: 0,
          }}
          barGap={2}
          barCategoryGap={isColumn ? "28%" : "24%"}
        >
          <CartesianGrid {...GRID_PROPS} vertical={!isColumn} horizontal={isColumn} />
          {isColumn ? (
            <>
              <XAxis
                dataKey={categoryKey}
                tick={AXIS_TICK}
                tickLine={false}
                axisLine={{ stroke: "var(--axis)" }}
                interval={0}
              />
              <YAxis
                tick={AXIS_TICK}
                tickLine={false}
                axisLine={false}
                width={52}
                tickFormatter={formatValue}
              />
            </>
          ) : (
            <>
              <XAxis
                type="number"
                tick={AXIS_TICK}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatValue}
              />
              <YAxis
                type="category"
                dataKey={categoryKey}
                tick={AXIS_TICK}
                tickLine={false}
                axisLine={{ stroke: "var(--axis)" }}
                width={categoryWidth}
                interval={0}
              />
            </>
          )}
          <Tooltip
            cursor={{ fill: "var(--grid)", fillOpacity: 0.45 }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <TooltipShell title={String(label)}>
                  {payload.map((entry, i) => (
                    <TooltipRow
                      key={String(entry.dataKey)}
                      color={
                        colors
                          ? colorAt(data.findIndex((d) => d[categoryKey] === label))
                          : (entry.color as string)
                      }
                      label={
                        series.find((s) => s.key === entry.dataKey)?.label ??
                        String(entry.name ?? i)
                      }
                      value={formatTooltip(Number(entry.value ?? 0))}
                    />
                  ))}
                </TooltipShell>
              );
            }}
          />
          {series.map((s, i) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              stackId={stacked ? "stack" : undefined}
              fill={s.color ?? SERIES[i % SERIES.length]}
              maxBarSize={MAX_BAR}
              isAnimationActive={false}
              radius={stacked ? 2 : isColumn ? [4, 4, 0, 0] : [0, 4, 4, 0]}
              stroke={stacked ? "var(--surface)" : undefined}
              strokeWidth={stacked ? 2 : 0}
            >
              {colors ? data.map((_, idx) => <Cell key={idx} fill={colorAt(idx)} />) : null}
              {labelled && !stacked ? (
                <LabelList
                  dataKey={s.key}
                  position={isColumn ? "top" : "right"}
                  offset={8}
                  fill="var(--ink-secondary)"
                  fontSize={11}
                  formatter={(v) => formatLabel(Number(v ?? 0))}
                />
              ) : null}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
