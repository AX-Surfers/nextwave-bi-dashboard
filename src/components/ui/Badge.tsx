import type { ReactNode } from "react";

export type Tone = "neutral" | "good" | "warning" | "serious" | "critical" | "info";

const TONE: Record<Tone, { dot: string; text: string; bg: string }> = {
  neutral: { dot: "bg-ink-muted", text: "text-ink-secondary", bg: "bg-surface-2" },
  good: { dot: "bg-good", text: "text-ink-secondary", bg: "bg-good/10" },
  warning: { dot: "bg-warning", text: "text-ink-secondary", bg: "bg-warning/15" },
  serious: { dot: "bg-serious", text: "text-ink-secondary", bg: "bg-serious/15" },
  critical: { dot: "bg-critical", text: "text-ink-secondary", bg: "bg-critical/12" },
  info: { dot: "bg-s1", text: "text-ink-secondary", bg: "bg-s1/10" },
};

/**
 * 상태 배지. 상태 색은 항상 '점 + 텍스트' 쌍으로만 쓴다 (색 단독 전달 금지).
 */
export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  const t = TONE[tone];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap ${t.bg} ${t.text}`}
    >
      <span className={`size-1.5 rounded-full ${t.dot}`} aria-hidden />
      {children}
    </span>
  );
}

export function riskTone(risk: string): Tone {
  if (risk === "높음") return "critical";
  if (risk === "보통") return "warning";
  return "good";
}

export function taskStatusTone(status: string): Tone {
  if (status === "완료") return "good";
  if (status === "진행중") return "info";
  if (status === "보류") return "serious";
  return "neutral";
}

export function ageTone(bucket: string): Tone {
  if (bucket === "90일초과") return "critical";
  if (bucket === "61~90일") return "serious";
  if (bucket === "31~60일") return "warning";
  if (bucket === "30일이하") return "info";
  if (bucket === "회수완료") return "good";
  return "neutral";
}
