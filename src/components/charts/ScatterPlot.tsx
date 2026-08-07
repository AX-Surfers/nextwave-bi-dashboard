"use client";

import {
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { AXIS_TICK, GRID_PROPS, Legend, TooltipRow, TooltipShell } from "./theme";
import { pct } from "@/lib/format";

export type Point = {
  name: string;
  x: number;
  y: number;
  z?: number;
  color: string;
  meta?: { label: string; value: string }[];
};

/**
 * 산점도 — 두 비율(진행률 × 예산소진율)의 관계와 이상치를 본다.
 * 색은 상태(리스크)를 나타내므로 아이콘 대신 범례 + 툴팁으로 라벨을 함께 준다.
 */
export function ScatterPlot({
  points,
  height = 300,
  xLabel,
  yLabel,
  legend,
  diagonal = true,
}: {
  points: Point[];
  height?: number;
  xLabel: string;
  yLabel: string;
  legend: { label: string; color: string }[];
  /** y = x 기준선 (진행률 대비 소진율 비교용) */
  diagonal?: boolean;
}) {
  return (
    <div>
      <Legend className="mb-3" items={legend} />
      <ResponsiveContainer width="100%" height={height}>
        <ScatterChart margin={{ top: 8, right: 16, bottom: 18, left: 0 }}>
          <CartesianGrid {...GRID_PROPS} />
          <XAxis
            type="number"
            dataKey="x"
            domain={[0, 1.2]}
            ticks={[0, 0.25, 0.5, 0.75, 1, 1.2]}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={{ stroke: "var(--axis)" }}
            tickFormatter={(v: number) => pct(v, 0)}
            label={{
              value: xLabel,
              position: "insideBottom",
              offset: -12,
              fill: "var(--ink-muted)",
              fontSize: 11,
            }}
          />
          <YAxis
            type="number"
            dataKey="y"
            domain={[0, 1.2]}
            ticks={[0, 0.25, 0.5, 0.75, 1, 1.2]}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={48}
            tickFormatter={(v: number) => pct(v, 0)}
            label={{
              value: yLabel,
              angle: -90,
              position: "insideLeft",
              offset: 16,
              fill: "var(--ink-muted)",
              fontSize: 11,
            }}
          />
          <ZAxis type="number" dataKey="z" range={[70, 320]} />
          {diagonal ? (
            <ReferenceLine
              segment={[
                { x: 0, y: 0 },
                { x: 1.2, y: 1.2 },
              ]}
              stroke="var(--axis)"
              strokeWidth={1}
            />
          ) : null}
          <ReferenceLine y={1} stroke="var(--critical)" strokeWidth={1} strokeOpacity={0.5} />
          <Tooltip
            cursor={{ stroke: "var(--axis)", strokeWidth: 1 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload as Point;
              return (
                <TooltipShell title={p.name}>
                  <TooltipRow color={p.color} label={xLabel} value={pct(p.x)} />
                  <TooltipRow label={yLabel} value={pct(p.y)} />
                  {p.meta?.map((m) => (
                    <TooltipRow key={m.label} label={m.label} value={m.value} muted />
                  ))}
                </TooltipShell>
              );
            }}
          />
          <Scatter data={points} fillOpacity={0.85} isAnimationActive={false}>
            {points.map((p, i) => (
              <Cell key={i} fill={p.color} stroke="var(--surface)" strokeWidth={2} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
