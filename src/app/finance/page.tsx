import { Card, CardHeader, SectionTitle } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/KpiCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Badge, type Tone } from "@/components/ui/Badge";
import { TrendChart } from "@/components/charts/TrendChart";
import { BarsChart } from "@/components/charts/BarsChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { getCashflow, getCompany, getIncomeStatement, getVouchers } from "@/lib/repository";
import { balanceSeries, byDate, growth, sumBy, topNWithOther, total } from "@/lib/aggregate";
import { compactWon, koDate, num, pct, shortDate, signedPct } from "@/lib/format";
import type { PlLine, VoucherRow } from "@/lib/types";

function approvalTone(status: string): Tone {
  if (status === "승인") return "good";
  if (status === "결재중") return "warning";
  return "critical";
}

function PlRow({
  label,
  current,
  previous,
  bold = false,
  indent = false,
  percentOf,
}: {
  label: string;
  current: number;
  previous: number;
  bold?: boolean;
  indent?: boolean;
  percentOf?: number;
}) {
  const g = growth(current, previous);
  const positive = g > 0;
  return (
    <tr className={`border-b border-line/60 ${bold ? "bg-surface-2 font-semibold" : ""}`}>
      <td className={`px-3 py-2 text-ink ${indent ? "pl-7 font-normal text-ink-secondary" : ""}`}>
        {label}
      </td>
      <td className="px-3 py-2 text-right tabular-nums text-ink">{num(current)}</td>
      <td className="px-3 py-2 text-right tabular-nums text-ink-muted">{num(previous)}</td>
      <td
        className={`px-3 py-2 text-right tabular-nums ${
          g === 0 ? "text-ink-muted" : positive ? "text-[var(--delta-up)]" : "text-[var(--delta-down)]"
        }`}
      >
        {num(current - previous)}
      </td>
      <td
        className={`px-3 py-2 text-right tabular-nums ${
          g === 0 ? "text-ink-muted" : positive ? "text-[var(--delta-up)]" : "text-[var(--delta-down)]"
        }`}
      >
        {previous ? signedPct(g) : "—"}
      </td>
      <td className="px-3 py-2 text-right tabular-nums text-ink-muted">
        {percentOf ? pct(current / percentOf) : ""}
      </td>
    </tr>
  );
}

export default async function FinancePage() {
  const [company, pl, cashflow, vouchers] = await Promise.all([
    getCompany(),
    getIncomeStatement(),
    getCashflow(),
    getVouchers(),
  ]);
  const t = pl.totals;

  // ------------------------------------------------------------------- 자금
  const ledger = cashflow.filter((r) => r.type !== "기초");
  const opening = cashflow[0]?.balance ?? 0;
  const closing = cashflow[cashflow.length - 1]?.balance ?? 0;
  const inflow = total(cashflow, (r) => r.inflow);
  const outflow = total(cashflow, (r) => r.outflow);

  const dates = [...new Set(ledger.map((r) => r.date))].sort();
  const balanceRows = balanceSeries(
    byDate(ledger, (r) => r.date, (r) => r.inflow - r.outflow),
    opening,
  );
  const flowRows = dates.map((date) => {
    const rows = ledger.filter((r) => r.date === date);
    return {
      key: shortDate(date),
      입금: rows.reduce((a, b) => a + b.inflow, 0),
      출금: -rows.reduce((a, b) => a + b.outflow, 0),
    };
  });

  const inflowByAccount = sumBy(
    ledger.filter((r) => r.inflow > 0),
    (r) => r.account,
    (r) => r.inflow,
  );
  const outflowByAccount = sumBy(
    ledger.filter((r) => r.outflow > 0),
    (r) => r.account,
    (r) => r.outflow,
  );

  // ------------------------------------------------------------------- 비용
  const sgaSorted = [...pl.sgaLines].sort((a, b) => b.current - a.current);
  const costByDept = sumBy(vouchers, (r) => r.dept, (r) => r.amount);
  const pending = vouchers.filter((v) => v.approval !== "승인");
  const deptCost = topNWithOther(costByDept, 8);
  const sgaDelta = [...pl.sgaLines]
    .sort((a, b) => Math.abs(b.current - b.previous) - Math.abs(a.current - a.previous))
    .slice(0, 8)
    .map((l) => ({ key: l.label, value: l.current - l.previous }));

  const plColumns = (
    <colgroup>
      <col />
      <col className="w-[15%]" />
      <col className="w-[15%]" />
      <col className="w-[14%]" />
      <col className="w-[11%]" />
      <col className="w-[10%]" />
    </colgroup>
  );

  const voucherColumns: Column<VoucherRow>[] = [
    { key: "date", header: "전표일자", cell: (r) => shortDate(r.date), width: "72px" },
    { key: "no", header: "전표번호", cell: (r) => <span className="text-ink-muted">{r.voucherNo}</span> },
    { key: "account", header: "계정과목", cell: (r) => <span className="font-medium text-ink">{r.account}</span> },
    { key: "type", header: "구분", cell: (r) => r.accountType },
    { key: "dept", header: "부서", cell: (r) => r.dept },
    { key: "vendor", header: "거래처", cell: (r) => r.vendor },
    { key: "memo", header: "적요", cell: (r) => <span className="text-ink-muted">{r.memo}</span> },
    {
      key: "amount",
      header: "금액",
      cell: (r) => <span className="font-medium text-ink">{num(r.amount)}</span>,
      align: "right",
      numeric: true,
    },
    {
      key: "approval",
      header: "결재상태",
      cell: (r) => <Badge tone={approvalTone(r.approval)}>{r.approval}</Badge>,
    },
  ];

  return (
    <>
      <PageHeader
        title="재무 / 손익"
        description="손익계산서와 자금 흐름, 비용 전표를 함께 봅니다."
        meta={`기준일 ${koDate(company.baseDate)}`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="매출총이익"
          value={`${compactWon(t.grossProfit.current)}원`}
          delta={growth(t.grossProfit.current, t.grossProfit.previous)}
          hint={`매출총이익률 ${pct(t.grossProfit.current / t.revenue.current)}`}
          accent="s1"
        />
        <KpiCard
          label="판매비와관리비"
          value={`${compactWon(t.sga.current)}원`}
          delta={growth(t.sga.current, t.sga.previous)}
          upIsGood={false}
          hint={`매출 대비 ${pct(t.sga.current / t.revenue.current)}`}
          accent="s2"
        />
        <KpiCard
          label="영업이익"
          value={`${compactWon(t.operatingProfit.current)}원`}
          delta={growth(t.operatingProfit.current, t.operatingProfit.previous)}
          hint={`영업이익률 ${pct(t.operatingProfit.current / t.revenue.current)}`}
          accent="s3"
        />
        <KpiCard
          label="기말 현금잔액"
          value={`${compactWon(closing)}원`}
          delta={growth(closing, opening)}
          deltaLabel="기초 대비"
          hint={`순증 ${compactWon(closing - opening)}원`}
          accent="s6"
          sparkline={balanceRows.slice(-12).map((r) => r.value)}
        />
      </div>

      <SectionTitle hint="당월은 원장 자동 집계 · 전월은 비교용 입력값">월간 손익계산서</SectionTitle>
      <Card padded={false} className="overflow-hidden p-0">
        <div className="thin-scroll overflow-auto">
          <table className="w-full border-collapse text-sm">
            {plColumns}
            <thead>
              <tr className="bg-surface-2 text-xs text-ink-secondary">
                <th className="px-3 py-2.5 text-left font-semibold">계정과목</th>
                <th className="px-3 py-2.5 text-right font-semibold">당월 (2026-07)</th>
                <th className="px-3 py-2.5 text-right font-semibold">전월 (2026-06)</th>
                <th className="px-3 py-2.5 text-right font-semibold">증감액</th>
                <th className="px-3 py-2.5 text-right font-semibold">증감률</th>
                <th className="px-3 py-2.5 text-right font-semibold">매출비</th>
              </tr>
            </thead>
            <tbody>
              {pl.revenueLines.map((l: PlLine) => (
                <PlRow key={l.label} label={l.label} current={l.current} previous={l.previous} indent percentOf={t.revenue.current} />
              ))}
              <PlRow label="매출액 합계" current={t.revenue.current} previous={t.revenue.previous} bold percentOf={t.revenue.current} />
              {pl.cogsLines.map((l: PlLine) => (
                <PlRow key={l.label} label={`${l.code} ${l.label}`} current={l.current} previous={l.previous} indent percentOf={t.revenue.current} />
              ))}
              <PlRow label="매출원가 합계" current={t.cogs.current} previous={t.cogs.previous} bold percentOf={t.revenue.current} />
              <PlRow label="매출총이익" current={t.grossProfit.current} previous={t.grossProfit.previous} bold percentOf={t.revenue.current} />
              {pl.sgaLines.map((l: PlLine) => (
                <PlRow key={l.label} label={`${l.code} ${l.label}`} current={l.current} previous={l.previous} indent percentOf={t.revenue.current} />
              ))}
              <PlRow label="판매비와관리비 합계" current={t.sga.current} previous={t.sga.previous} bold percentOf={t.revenue.current} />
              <PlRow label="영업이익" current={t.operatingProfit.current} previous={t.operatingProfit.previous} bold percentOf={t.revenue.current} />
              <PlRow label="이자수익" current={t.interestIncome.current} previous={t.interestIncome.previous} indent />
              <PlRow label="이자비용" current={t.interestCost.current} previous={t.interestCost.previous} indent />
              <PlRow label="법인세차감전순이익" current={t.pretaxProfit.current} previous={t.pretaxProfit.previous} bold percentOf={t.revenue.current} />
              <PlRow label={`법인세비용 (세율 ${pct(pl.taxRate, 0)})`} current={t.tax.current} previous={t.tax.previous} indent />
              <PlRow label="당기순이익" current={t.netProfit.current} previous={t.netProfit.previous} bold percentOf={t.revenue.current} />
            </tbody>
          </table>
        </div>
        <p className="border-t border-line px-3 py-2.5 text-xs text-ink-muted">
          단위: 원 · 매출액은 01_매출상세 공급가액 기준, 원가·판관비는 03_회계_전표 계정코드 기준 집계.
          전월 수치와 이자수익·법인세율은 비교용 가정값입니다.
        </p>
      </Card>

      <SectionTitle>비용 구조</SectionTitle>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="판관비 구성 TOP 10"
            subtitle="계정과목별 · 03_회계_전표"
            right={`합계 ${compactWon(t.sga.current)}원`}
          />
          <BarsChart
            data={sgaSorted.slice(0, 10).map((l) => ({ key: l.label, value: l.current }))}
            series={[{ key: "value", label: "당월 비용" }]}
            layout="horizontal"
            categoryWidth={112}
            height={300}
            colors="var(--series-2)"
          />
        </Card>

        <Card>
          <CardHeader title="원가 vs 판관비 vs 이익" subtitle="매출 1,506백만원의 사용처" />
          <DonutChart
            data={[
              { key: "매출원가", value: t.cogs.current, color: "var(--series-2)" },
              { key: "판매비와관리비", value: t.sga.current, color: "var(--series-4)" },
              { key: "영업이익", value: t.operatingProfit.current, color: "var(--series-3)" },
            ]}
            centerLabel="매출액"
            centerValue={`${compactWon(t.revenue.current)}원`}
          />
        </Card>

        <Card>
          <CardHeader
            title="부서별 비용 집행"
            subtitle="전표 금액 합계 (원가 + 판관비)"
            right={`총 ${compactWon(total(vouchers, (v) => v.amount))}원`}
          />
          <BarsChart
            data={deptCost.map((c) => ({ key: c.key, value: c.value }))}
            series={[{ key: "value", label: "집행액" }]}
            layout="horizontal"
            categoryWidth={104}
            height={280}
            colors={deptCost.map((b) => (b.key === "기타" ? "var(--seq-1)" : "var(--series-5)"))}
          />
        </Card>

        <Card>
          <CardHeader
            title="전월 대비 증감이 큰 판관비"
            subtitle="증감액 절대값 상위 8개 계정"
          />
          <BarsChart
            data={sgaDelta}
            series={[{ key: "value", label: "증감액" }]}
            layout="horizontal"
            categoryWidth={112}
            height={280}
            colors={sgaDelta.map((r) => (r.value >= 0 ? "var(--series-8)" : "var(--series-1)"))}
          />
          <p className="mt-2 text-xs text-ink-muted">
            빨강은 전월 대비 증가(비용 상승), 파랑은 감소를 뜻합니다.
          </p>
        </Card>
      </div>

      <SectionTitle>자금 흐름</SectionTitle>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardHeader
            title="일별 현금 잔액"
            subtitle={`기초 ${compactWon(opening)}원 → 기말 ${compactWon(closing)}원`}
            right={`입금 ${compactWon(inflow)} · 출금 ${compactWon(outflow)}`}
          />
          <TrendChart
            data={balanceRows}
            series={[{ key: "value", label: "잔액", kind: "line" }]}
            baseline="auto"
            xFormat="shortDate"
            valueFormat="axisWon"
            height={240}
          />
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="일별 입출금" subtitle="위쪽 입금 / 아래쪽 출금 (같은 축)" />
          <BarsChart
            data={flowRows}
            series={[
              { key: "입금", label: "입금", color: "var(--series-1)" },
              { key: "출금", label: "출금", color: "var(--series-2)" },
            ]}
            stacked
            height={260}
            valueFormat="axisWon"
            tooltipFormat="won"
          />
        </Card>

        <Card>
          <CardHeader title="입금 사유별" subtitle="계정 기준" right={`총 ${compactWon(inflow)}원`} />
          <DonutChart
            data={inflowByAccount.map((c) => ({ key: c.key, value: c.value }))}
            centerLabel="총 입금"
            centerValue={`${compactWon(inflow)}원`}
            height={210}
          />
        </Card>

        <Card>
          <CardHeader title="출금 사유별" subtitle="계정 기준" right={`총 ${compactWon(outflow)}원`} />
          <DonutChart
            data={outflowByAccount.map((c) => ({ key: c.key, value: c.value }))}
            centerLabel="총 출금"
            centerValue={`${compactWon(outflow)}원`}
            height={210}
          />
        </Card>
      </div>

      <SectionTitle hint={`결재중 ${pending.filter((v) => v.approval === "결재중").length}건 · 반려 ${pending.filter((v) => v.approval === "반려").length}건`}>
        미승인 전표 (마감 전 정리 대상)
      </SectionTitle>
      <Card>
        <CardHeader
          title="결재 미완료 전표"
          subtitle="승인되지 않은 비용 전표 — 월 마감 전 확인 필요"
          right={`${pending.length}건 · ${compactWon(total(pending, (v) => v.amount))}원`}
        />
        <DataTable columns={voucherColumns} rows={pending} rowKey={(r) => r.voucherNo} maxHeight="24rem" />
      </Card>

      <div className="mt-4">
        <Card>
          <CardHeader
            title="전체 비용 전표"
            subtitle="03_회계_전표 원장 (금액 내림차순)"
            right={`${vouchers.length}건`}
          />
          <DataTable
            columns={voucherColumns}
            rows={[...vouchers].sort((a, b) => b.amount - a.amount)}
            rowKey={(r) => r.voucherNo}
            maxHeight="30rem"
          />
        </Card>
      </div>
    </>
  );
}
