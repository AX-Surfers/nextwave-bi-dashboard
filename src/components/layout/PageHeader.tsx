import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  meta,
  children,
}: {
  title: string;
  description: string;
  meta?: string;
  children?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-ink">{title}</h1>
        <p className="mt-1 text-sm text-ink-secondary">{description}</p>
      </div>
      <div className="flex items-center gap-3">
        {meta ? (
          <span className="rounded-md border border-line bg-surface px-2.5 py-1.5 text-xs text-ink-secondary">
            {meta}
          </span>
        ) : null}
        {children}
      </div>
    </header>
  );
}
