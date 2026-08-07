import { Card, CardHeader, SectionTitle } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/KpiCard";
import { AlertList, type Alert } from "@/components/ui/AlertList";
import { Badge, ageTone } from "@/components/ui/Badge";
import { PageHeader } from "@/components/layout/PageHeader";
import { TrendChart } from "@/components/charts/TrendChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { BarsChart } from "@/components/charts/BarsChart";
import { FunnelBars } from "@/components/charts/FunnelBars";
import {
  getCashflow,
  getCompany,
  getIncomeStatement,
  getPayroll,
  getPipeline,
  getProjects,
  getReceivables,
  getSales,
  getTasks,
  getVouchers,
} from "@/lib/repository";
import { balanceSeries, byDate, growth, orderBuckets, sumBy, total } from "@/lib/aggregate";
import { compactWon, koDate, num, pct, signedPct, won } from "@/lib/format";

const AGE_ORDER = ["정상", "30일이하", "31~60일", "61~90일", "90일초과"] as const;

const AGE_COLOR: Record<string, string> = {
  정상: "var(--seq-1)",
  "30일이하": "var(--seq-3)",
  "31~60일": "var(--warning)",
  "61~90일": "var(--serious)",
  "90일초과": "var(--critical)",
};
const STAGE_ORDER = ["컨택", "미팅/데모", "제안", "견적/협상", "수주", "실주"] as const;

export default async function OverviewPage() {
  const [company, pl, sales, receivables, pipeline, cashflow, projects, tasks, payroll, vouchers] =
    await Promise.all([
      getCompany(),
      getIncomeStatement(),
      getSales(),
      getReceivables(),
      getPipeline(),
      getCashflow(),
      getProjects(),
      getTasks(),
      getPayroll(),
      getVouchers(),
    ]);

  const t = pl.totals;

  // ---------------------------------------------------------------- 매출 추이
  const daily = byDate(sales, (r) => r.date, (r) => r.supplyAmount);
  const dailyRows = daily.map((d) => ({ date: d.date, value: d.value }));

  const byCategory = sumBy(sales, (r) => r.category, (r) => r.supplyAmount);

  // ------------------------------------------------------------------- 채권
  const arOutstanding = total(receivables, (r) => r.outstanding);
  const overdue = receivables.filter((r) => r.overdueDays > 30);
  const overdueAmount = total(overdue, (r) => r.outstanding);
  const aging = orderBuckets(
    sumBy(
      receivables.filter((r) => r.outstanding > 0),
      (r) => r.ageBucket,
      (r) => r.outstanding,
    ),
    AGE_ORDER,
  );

  // ------------------------------------------------------------------- 자금
  const cashRows = byDate(
    cashflow.filter((r) => r.type !== "기초"),
    (r) => r.date,
    (r) => r.inflow - r.outflow,
  );
  const openingBalance = cashflow[0]?.balance ?? 0;
  const balanceRows = balanceSeries(cashRows, openingBalance);
  const closingBalance = cashflow[cashflow.length - 1]?.balance ?? 0;
  const inflow = total(cashflow, (r) => r.inflow);
  const outflow = total(cashflow, (r) => r.outflow);

  // ----------------------------------------------------------------- 파이프라인
  const stageBuckets = orderBuckets(
    sumBy(pipeline, (r) => r.stage, (r) => r.amount),
    STAGE_ORDER,
  );
  const weightedByStage = new Map(
    sumBy(pipeline, (r) => r.stage, (r) => r.weightedAmount).map((b) => [b.key, b.value]),
  );
  const stages = stageBuckets
    .filter((b) => b.key !== "실주")
    .map((b) => ({
      stage: b.key,
      count: b.count,
      amount: b.value,
      weighted: weightedByStage.get(b.key) ?? 0,
    }));
  const weightedTotal = total(pipeline, (r) => r.weightedAmount);
  const idleDeals = pipeline.filter((d) => d.idleDays > 14 && d.stage !== "수주" && d.stage !== "실주");

  // -------------------------------------------------------------- 업무 / 인사
  const delayedTasks = tasks.filter((t) => t.delayDays > 0);
  const overBudget = projects.filter((p) => p.budgetUsage > 1);
  const highRisk = projects.filter((p) => p.risk === "높음");
  const pendingVouchers = vouchers.filter((v) => v.approval !== "승인");
  const payrollTotal = total(payroll, (r) => r.grossPay);

  // 손익 구조 (매출 -> 원가 -> 판관비 -> 영업이익)
  const plStructure = [
    { key: "매출액", value: t.revenue.current },
    { key: "매출원가", value: t.cogs.current },
    { key: "판매비와관리비", value: t.sga.current },
    { key: "영업이익", value: t.operatingProfit.current },
  ];

  const alerts: Alert[] = [
    {
      tone: "critical",
      title: `30일 초과 연체 채권 ${won(overdueAmount)}`,
      detail: `전체 미수금 ${compactWon(arOutstanding)}원의 ${pct(overdueAmount / arOutstanding, 0)} · 연체 ${overdue.length}건`,
      href: "/receivables",
      cta: "채권 보기",
    },
    {
      tone: "serious",
      title: `2주 이상 미접촉 딜 ${idleDeals.length}건`,
      detail: `방치 딜 예상금액 합계 ${compactWon(total(idleDeals, (d) => d.amount))}원 · 최장 ${Math.max(...idleDeals.map((d) => d.idleDays))}일 미접촉`,
      href: "/pipeline",
      cta: "파이프라인 보기",
    },
    {
      tone: "warning",
      title: `지연 태스크 ${delayedTasks.length}건 / 전체 ${tasks.length}건`,
      detail: `예산 초과 프로젝트 ${overBudget.length}건 · 고위험 프로젝트 ${highRisk.length}건`,
      href: "/projects",
      cta: "프로젝트 보기",
    },
    {
      tone: "info",
      title: `미승인 전표 ${pendingVouchers.length}건`,
      detail: `결재중 ${pendingVouchers.filter((v) => v.approval === "결재중").length}건 · 반려 ${pendingVouchers.filter((v) => v.approval === "반려").length}건 — 마감 전 정리 필요`,
      href: "/finance",
      cta: "전표 보기",
    },
  ];

  return (
    <>
      <PageHeader
        title="경영 요약"
        description={`${company.name}의 2026년 7월 경영 실적과 리스크를 한 화면에서 확인합니다.`}
        meta={`기준일 ${koDate(company.baseDate)}`}
      />

      {/* ------------------------------------------------------ 히어로 + KPI */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="text-xs font-medium text-ink-secondary">7월 매출액 (공급가액 기준)</p>
              <p className="mt-1.5 text-5xl leading-none font-semibold tracking-tight text-ink">
                {compactWon(t.revenue.current)}
                <span className="ml-1 text-2xl font-medium text-ink-secondary">원</span>
              </p>
              <p className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                <span className="font-medium text-[var(--delta-up)]">
                  ▲ {signedPct(growth(t.revenue.current, t.revenue.previous))}
                  <span className="ml-1 font-normal text-ink-muted">전월 대비</span>
                </span>
                <span className="text-ink-muted">
                  전월 {compactWon(t.revenue.previous)}원 · 거래 {num(sales.length)}건
                </span>
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4">
              {byCategory.map((c, i) => (
                <div key={c.key}>
                  <dt className="flex items-center gap-1.5 text-[11px] text-ink-muted">
                    <span
                      className="size-2 rounded-[2px]"
                      style={{ background: `var(--series-${i + 1})` }}
                      aria-hidden
                    />
                    {c.key}
                  </dt>
                  <dd className="mt-0.5 text-sm font-semibold tabular-nums text-ink">
                    {compactWon(c.value)}
                  </dd>
                  <dd className="text-[11px] tabular-nums text-ink-muted">
                    {pct(c.value / t.revenue.current, 1)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="mt-5 border-t border-line pt-4">
            <TrendChart
              data={dailyRows}
              series={[{ key: "value", label: "일별 매출", kind: "area" }]}
              xFormat="shortDate"
              height={300}
            />
          </div>
        </Card>

        <Card padded={false} className="p-5">
          <CardHeader title="이슈 알림" subtitle="즉시 조치가 필요한 항목" />
          <AlertList alerts={alerts} />
        </Card>
      </div>

      {/* ------------------------------------------------------------- KPI 행 */}
      <SectionTitle hint="전월 대비 증감은 02_손익계산서의 전월 실적 기준">핵심 지표</SectionTitle>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="영업이익"
          value={`${compactWon(t.operatingProfit.current)}원`}
          delta={growth(t.operatingProfit.current, t.operatingProfit.previous)}
          hint={`영업이익률 ${pct(t.operatingProfit.current / t.revenue.current)}`}
          accent="s3"
        />
        <KpiCard
          label="당기순이익"
          value={`${compactWon(t.netProfit.current)}원`}
          delta={growth(t.netProfit.current, t.netProfit.previous)}
          hint={`순이익률 ${pct(t.netProfit.current / t.revenue.current)}`}
          accent="s6"
        />
        <KpiCard
          label="기말 현금잔액"
          value={`${compactWon(closingBalance)}원`}
          delta={growth(closingBalance, openingBalance)}
          deltaLabel="기초 대비"
          hint={`입금 ${compactWon(inflow)} / 출금 ${compactWon(outflow)}`}
          accent="s1"
          sparkline={balanceRows.slice(-12).map((r) => r.value)}
        />
        <KpiCard
          label="총 미수금"
          value={`${compactWon(arOutstanding)}원`}
          hint={`30일 초과 연체 ${pct(overdueAmount / arOutstanding, 0)} · ${overdue.length}건`}
          accent="critical"
        />
        <KpiCard
          label="파이프라인 가중 예상매출"
          value={`${compactWon(weightedTotal)}원`}
          hint={`총 ${compactWon(total(pipeline, (p) => p.amount))}원 · 딜 ${pipeline.length}건`}
          accent="s2"
        />
        <KpiCard
          label="7월 급여 지급총액"
          value={`${compactWon(payrollTotal)}원`}
          hint={`매출 대비 ${pct(payrollTotal / t.revenue.current)} · 재직 ${num(payroll.length)}명`}
          accent="s5"
        />
        <KpiCard
          label="진행중 프로젝트"
          value={`${num(projects.filter((p) => p.status === "진행중").length)}건`}
          hint={`예산 소진율 ${pct(total(projects, (p) => p.spent) / total(projects, (p) => p.budget))} · 고위험 ${highRisk.length}건`}
          accent="s4"
        />
        <KpiCard
          label="지연 태스크"
          value={`${num(delayedTasks.length)}건`}
          hint={`전체 ${tasks.length}건 중 ${pct(delayedTasks.length / tasks.length, 0)}`}
          accent="warning"
        />
      </div>

      {/* --------------------------------------------------------- 분석 그리드 */}
      <SectionTitle hint="각 카드는 상세 페이지로 이어집니다">부문별 현황</SectionTitle>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="카테고리별 매출 구성"
            subtitle="01_매출상세 공급가액 기준"
            right={`${num(sales.length)}건`}
          />
          <DonutChart
            data={byCategory.map((c) => ({ key: c.key, value: c.value }))}
            centerLabel="총 매출"
            centerValue={`${compactWon(t.revenue.current)}원`}
          />
        </Card>

        <Card>
          <CardHeader title="손익 구조" subtitle="매출액에서 영업이익까지" />
          <BarsChart
            data={plStructure}
            series={[{ key: "value", label: "금액" }]}
            layout="horizontal"
            height={220}
            categoryWidth={110}
            labelled
            labelFormat="compactWon"
            colors={plStructure.map((r) =>
              r.key === "영업이익"
                ? "var(--series-3)"
                : r.key === "매출액"
                  ? "var(--series-1)"
                  : "var(--seq-1)",
            )}
          />
          <dl className="mt-3 grid grid-cols-3 gap-3 border-t border-line pt-3 text-center">
            {[
              { label: "매출총이익률", value: t.grossProfit.current / t.revenue.current },
              { label: "영업이익률", value: t.operatingProfit.current / t.revenue.current },
              { label: "순이익률", value: t.netProfit.current / t.revenue.current },
            ].map((m) => (
              <div key={m.label}>
                <dt className="text-[11px] text-ink-muted">{m.label}</dt>
                <dd className="mt-0.5 text-base font-semibold tabular-nums text-ink">
                  {pct(m.value)}
                </dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card>
          <CardHeader
            title="일별 현금 잔액 추이"
            subtitle="04_자금_입출금 기준"
            right={`기말 ${compactWon(closingBalance)}원`}
          />
          <TrendChart
            data={balanceRows}
            series={[{ key: "value", label: "잔액", kind: "line" }]}
            baseline="auto"
            xFormat="shortDate"
            valueFormat="axisWon"
            height={200}
          />
        </Card>

        <Card>
          <CardHeader
            title="채권 연령 분석"
            subtitle="미수 잔액 기준 · 만기일 경과일수"
            right={`총 ${compactWon(arOutstanding)}원`}
          />
          <BarsChart
            data={aging.map((b) => ({ key: b.key, value: b.value, count: b.count }))}
            series={[{ key: "value", label: "미수 잔액" }]}
            height={200}
            colors={aging.map((b) => AGE_COLOR[b.key])}
          />
          <ul className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
            {aging.map((b) => (
              <li key={b.key}>
                <Badge tone={ageTone(b.key)}>
                  {b.key} {b.count}건 · {compactWon(b.value)}
                </Badge>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="영업 파이프라인 단계별 현황"
            subtitle="실주 제외 · 확률 가중 예상매출 병기"
            right={`가중 합계 ${compactWon(weightedTotal)}원`}
          />
          <FunnelBars stages={stages} />
        </Card>
      </div>
    </>
  );
}
