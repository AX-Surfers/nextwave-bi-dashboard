import { compactWon, num, pct } from "@/lib/format";

export type FunnelStage = {
  stage: string;
  count: number;
  amount: number;
  weighted: number;
};

/**
 * 파이프라인 퍼널 — 단계는 순서가 의미를 가지므로 순차(단일 색) 램프를 쓴다.
 * 막대 위에 가중예상금액을 겹쳐 실제 기대값을 함께 보여준다.
 */
export function FunnelBars({ stages }: { stages: FunnelStage[] }) {
  const max = Math.max(...stages.map((s) => s.amount), 1);
  // 순차 램프: 진행 단계가 뒤로 갈수록 진하게
  const ramp = ["var(--seq-1)", "var(--seq-2)", "var(--seq-3)", "var(--seq-4)", "var(--seq-5)", "var(--seq-6)"];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-xs text-ink-secondary">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-[2px] bg-[var(--seq-3)]" aria-hidden />
          예상금액
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="size-2 rounded-[2px] border border-[var(--ink-muted)]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, var(--ink-muted) 0 1px, transparent 1px 3px)",
            }}
            aria-hidden
          />
          가중 예상매출 (확률 반영)
        </span>
      </div>

      <ul className="space-y-2.5">
        {stages.map((s, i) => (
          <li key={s.stage}>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-xs">
              <span className="font-medium text-ink">
                {s.stage}
                <span className="ml-1.5 font-normal text-ink-muted">{num(s.count)}건</span>
              </span>
              <span className="tabular-nums text-ink-secondary">
                {compactWon(s.amount)}
                <span className="ml-1.5 text-ink-muted">→ {compactWon(s.weighted)}</span>
              </span>
            </div>
            <div className="relative h-5 overflow-hidden rounded-[4px] bg-surface-2">
              <div
                className="absolute inset-y-0 left-0 rounded-[4px]"
                style={{ width: `${(s.amount / max) * 100}%`, background: ramp[i % ramp.length] }}
              />
              <div
                className="absolute inset-y-0 left-0 rounded-[4px]"
                style={{
                  width: `${(s.weighted / max) * 100}%`,
                  backgroundImage:
                    "repeating-linear-gradient(45deg, rgba(255,255,255,0.65) 0 2px, transparent 2px 5px)",
                }}
                aria-hidden
              />
            </div>
            <p className="mt-1 text-[11px] text-ink-muted">
              전체 파이프라인의 {pct(s.amount / (stages.reduce((a, b) => a + b.amount, 0) || 1), 1)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
