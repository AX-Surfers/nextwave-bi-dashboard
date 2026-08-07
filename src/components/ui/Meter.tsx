/**
 * 진행률 / 소진율 미터.
 * 채움색이 심각도를 나타내고, 트랙은 같은 램프의 옅은 단계를 쓴다.
 */
export function Meter({
  value,
  tone = "auto",
  label,
  className = "",
}: {
  /** 0~1 (1 초과 시 100%로 캡, over 표시) */
  value: number;
  tone?: "auto" | "neutral" | "good" | "warning" | "critical";
  label?: string;
  className?: string;
}) {
  const over = value > 1;
  const width = Math.min(Math.max(value, 0), 1) * 100;
  const resolved =
    tone !== "auto" ? tone : over || value >= 0.95 ? "critical" : value >= 0.8 ? "warning" : "neutral";

  const fill =
    resolved === "critical"
      ? "bg-critical"
      : resolved === "warning"
        ? "bg-warning"
        : resolved === "good"
          ? "bg-good"
          : "bg-s1";

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className="h-1.5 min-w-16 flex-1 overflow-hidden rounded-full bg-[var(--seq-1)]/25"
        role="meter"
        aria-valuenow={Math.round(value * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div className={`h-full rounded-full ${fill}`} style={{ width: `${width}%` }} />
      </div>
      <span className="w-12 shrink-0 text-right text-xs tabular-nums text-ink-secondary">
        {(value * 100).toFixed(0)}%
      </span>
    </div>
  );
}
