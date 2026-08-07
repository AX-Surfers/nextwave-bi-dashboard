import Link from "next/link";
import type { Tone } from "./Badge";

export type Alert = {
  tone: Extract<Tone, "critical" | "serious" | "warning" | "info">;
  title: string;
  detail: string;
  href: string;
  cta: string;
};

const MARK: Record<Alert["tone"], { icon: string; color: string; label: string }> = {
  critical: { icon: "M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z", color: "var(--critical)", label: "위험" },
  serious: { icon: "M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z", color: "var(--serious)", label: "경고" },
  warning: { icon: "M12 8v5m0 3h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z", color: "var(--warning)", label: "주의" },
  info: { icon: "M12 16v-5m0-3h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z", color: "var(--series-1)", label: "정보" },
};

/**
 * 이슈 알림. 상태색은 아이콘 + 등급 라벨과 항상 함께 나온다(색 단독 전달 금지).
 */
export function AlertList({ alerts }: { alerts: Alert[] }) {
  return (
    <ul className="divide-y divide-line">
      {alerts.map((alert) => {
        const mark = MARK[alert.tone];
        return (
          <li key={alert.title} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke={mark.color}
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mt-0.5 size-4 shrink-0"
              aria-hidden
            >
              <path d={mark.icon} />
            </svg>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink">
                <span className="mr-1.5 text-[11px] font-semibold" style={{ color: mark.color }}>
                  [{mark.label}]
                </span>
                {alert.title}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">{alert.detail}</p>
            </div>
            <Link
              href={alert.href}
              className="shrink-0 rounded-md border border-line px-2.5 py-1 text-xs font-medium text-ink-secondary transition-colors hover:bg-surface-2 hover:text-ink"
            >
              {alert.cta}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
