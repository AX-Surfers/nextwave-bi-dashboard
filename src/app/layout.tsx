import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { getCompany } from "@/lib/repository";
import { koDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "넥스트웨이브 경영 BI 대시보드",
  description:
    "(주)넥스트웨이브 2026년 7월 경영 데이터 — 매출·손익·자금·채권·영업·인사·프로젝트 통합 대시보드",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const company = await getCompany();
  const period = `${koDate(company.periodStart)} ~ ${koDate(company.periodEnd)}`;

  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full">
        <Sidebar company={company.name} period={period} />
        <div className="lg:pl-60">
          <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </main>
          <footer className="mx-auto max-w-[1440px] px-4 pb-10 text-xs text-ink-muted sm:px-6 lg:px-8">
            <p>
              {company.name} · {company.industry} · 기준일 {koDate(company.baseDate)}
            </p>
            <p className="mt-1">
              본 화면의 모든 회사·인물·거래처·금액은 교육 실습용 가상 데이터입니다.
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}
