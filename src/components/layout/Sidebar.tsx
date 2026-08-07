"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { NAV } from "./nav";

function Icon({ path }: { path: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-[18px] shrink-0"
      aria-hidden
    >
      <path d={path} />
    </svg>
  );
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="space-y-0.5" aria-label="주요 메뉴">
      {NAV.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`group flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors ${
              active
                ? "bg-s1/10 text-ink"
                : "text-ink-secondary hover:bg-surface-2 hover:text-ink"
            }`}
          >
            <span className={active ? "text-s1" : "text-ink-muted group-hover:text-ink-secondary"}>
              <Icon path={item.icon} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium">{item.label}</span>
              <span className="block text-[11px] text-ink-muted">{item.description}</span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar({ company, period }: { company: string; period: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* 모바일 헤더 */}
      <div className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line bg-surface px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2.5">
          <Wordmark />
          <div>
            <p className="text-[11px] font-medium text-ink-secondary">{company}</p>
            <p className="text-[11px] text-ink-muted">{period}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="메뉴 열기"
          className="rounded-md border border-line px-2.5 py-1.5 text-ink-secondary hover:bg-surface-2"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="size-5">
            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      {open ? (
        <div className="border-b border-line bg-surface px-3 py-3 lg:hidden">
          <NavList onNavigate={() => setOpen(false)} />
        </div>
      ) : null}

      {/* 데스크톱 사이드바 */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line bg-surface px-3 py-5 lg:flex">
        <div className="mb-6 px-2">
          <Wordmark />
          <p className="mt-2 truncate text-xs font-medium text-ink-secondary">{company}</p>
          <p className="text-[11px] text-ink-muted">경영 BI 대시보드</p>
        </div>
        <NavList />
        <div className="mt-auto rounded-lg border border-line bg-surface-2 px-3 py-2.5">
          <p className="text-[11px] text-ink-muted">데이터 기준</p>
          <p className="mt-0.5 text-xs font-medium text-ink-secondary">{period}</p>
        </div>
      </aside>
    </>
  );
}

function Wordmark() {
  return (
    <Image
      src="/logo.png"
      alt="Surfers"
      width={326}
      height={81}
      priority
      className="h-6 w-auto"
    />
  );
}
