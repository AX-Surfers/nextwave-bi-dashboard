import { Card, CardHeader, SectionTitle } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/KpiCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Badge, ageTone } from "@/components/ui/Badge";
import { Meter } from "@/components/ui/Meter";
import { BarsChart } from "@/components/charts/BarsChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { getCompany, getReceivables } from "@/lib/repository";
import { orderBuckets, sumBy, total } from "@/lib/aggregate";
import { compactWon, koDate, num, pct, won } from "@/lib/format";
import type { ReceivableRow } from "@/lib/types";

const AGE_ORDER = ["정상", "30일이하", "31~60일", "61~90일", "90일초과"] as const;

const AGE_COLOR: Record<string, string> = {
  정상: "var(--seq-1)",
  "30일이하": "var(--seq-3)",
  "31~60일": "var(--warning)",
  "61~90일": "var(--serious)",
  "90일초과": "var(--critical)",
};

export default async function ReceivablesPage() {
  const [company, receivables] = await Promise.all([getCompany(), getReceivables()]);

  const open = receivables.filter((r) => r.outstanding > 0);
  const billed = total(receivables, (r) => r.billed);
  const paid = total(receivables, (r) => r.paid);
  const outstanding = total(receivables, (r) => r.outstanding);
  const overdue = open.filter((r) => r.overdueDays > 30);
  const overdueAmount = total(overdue, (r) => r.outstanding);
  const critical = open.filter((r) => r.overdueDays > 60);

  const aging = orderBuckets(
    sumBy(open, (r) => r.ageBucket, (r) => r.outstanding),
    AGE_ORDER,
  );

  // 담당자별 회수 현황
  const owners = [...new Set(receivables.map((r) => r.owner))].map((owner) => {
    const rows = receivables.filter((r) => r.owner === owner);
    const b = total(rows, (r) => r.billed);
    const p = total(rows, (r) => r.paid);
    const o = total(rows, (r) => r.outstanding);
    const late = rows.filter((r) => r.overdueDays > 30);
    return {
      owner,
      billed: b,
      paid: p,
      outstanding: o,
      rate: b ? p / b : 0,
      count: rows.length,
      lateCount: late.length,
      lateAmount: total(late, (r) => r.outstanding),
    };
  });
  owners.sort((a, b) => b.outstanding - a.outstanding);

  const byIndustry = sumBy(open, (r) => r.industry, (r) => r.outstanding);
  const byCustomer = sumBy(open, (r) => r.customer, (r) => r.outstanding);

  const columns: Column<ReceivableRow>[] = [
    { key: "no", header: "청구번호", cell: (r) => <span className="text-ink-muted">{r.invoiceNo}</span> },
    { key: "customer", header: "거래처", cell: (r) => <span className="font-medium text-ink">{r.customer}</span> },
    { key: "industry", header: "산업군", cell: (r) => r.industry },
    { key: "issue", header: "청구일", cell: (r) => r.issueDate.slice(5), width: "76px" },
    { key: "due", header: "만기일", cell: (r) => r.dueDate.slice(5), width: "76px" },
    { key: "billed", header: "청구금액", cell: (r) => num(r.billed), align: "right", numeric: true },
    { key: "paid", header: "입금액", cell: (r) => num(r.paid), align: "right", numeric: true },
    {
      key: "outstanding",
      header: "미수금",
      cell: (r) => (
        <span className={r.outstanding > 0 ? "font-semibold text-ink" : "text-ink-muted"}>
          {num(r.outstanding)}
        </span>
      ),
      align: "right",
      numeric: true,
    },
    {
      key: "days",
      header: "경과일수",
      cell: (r) => (r.outstanding > 0 ? `${num(r.overdueDays)}일` : "—"),
      align: "right",
      numeric: true,
    },
    { key: "bucket", header: "연령구간", cell: (r) => <Badge tone={ageTone(r.ageBucket)}>{r.ageBucket}</Badge> },
    { key: "owner", header: "담당자", cell: (r) => r.owner },
    { key: "status", header: "회수상태", cell: (r) => r.status },
  ];

  return (
    <>
      <PageHeader
        title="채권 관리"
        description="미수금 연령분석과 담당자별 회수 현황으로 회수 우선순위를 정합니다."
        meta={`기준일 ${koDate(company.baseDate)} · 만기 = 청구일 +30일`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="총 미수금"
          value={`${compactWon(outstanding)}원`}
          hint={`청구 ${compactWon(billed)}원 중 미회수 ${pct(outstanding / billed, 0)}`}
          accent="critical"
        />
        <KpiCard
          label="30일 초과 연체"
          value={`${compactWon(overdueAmount)}원`}
          hint={`미수금의 ${pct(overdueAmount / outstanding, 0)} · ${overdue.length}건`}
          accent="warning"
        />
        <KpiCard
          label="회수율"
          value={pct(paid / billed)}
          hint={`입금 ${compactWon(paid)}원 / 청구 ${compactWon(billed)}원`}
          accent="good"
        />
        <KpiCard
          label="60일 초과 고위험"
          value={`${num(critical.length)}건`}
          hint={`금액 ${compactWon(total(critical, (r) => r.outstanding))}원`}
          accent="s2"
        />
      </div>

      <SectionTitle hint="만기일 경과일수 기준 · 색과 함께 구간명을 항상 표기">연령 분석</SectionTitle>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="연령구간별 미수 잔액"
            subtitle="경과일수가 길수록 회수 난이도가 높아집니다"
            right={`미회수 ${open.length}건`}
          />
          <BarsChart
            data={aging.map((b) => ({ key: b.key, value: b.value }))}
            series={[{ key: "value", label: "미수 잔액" }]}
            height={240}
            colors={aging.map((b) => AGE_COLOR[b.key])}
            labelled
            labelFormat="compactWon"
          />
          <ul className="mt-3 space-y-1.5 border-t border-line pt-3">
            {aging.map((b) => (
              <li key={b.key} className="flex items-center gap-2 text-sm">
                <span
                  className="size-2.5 shrink-0 rounded-[3px]"
                  style={{ background: AGE_COLOR[b.key] }}
                  aria-hidden
                />
                <span className="flex-1 text-ink-secondary">{b.key}</span>
                <span className="tabular-nums text-ink-muted">{b.count}건</span>
                <span className="w-32 shrink-0 text-right tabular-nums whitespace-nowrap text-ink">
                  {won(b.value)}
                </span>
                <span className="w-12 text-right tabular-nums text-ink-muted">
                  {pct(b.value / outstanding, 0)}
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader title="산업군별 미수금" subtitle="회수 리스크가 몰린 산업 확인" />
          <DonutChart
            data={byIndustry.slice(0, 6).map((b) => ({ key: b.key, value: b.value }))}
            centerLabel="총 미수금"
            centerValue={`${compactWon(outstanding)}원`}
            height={220}
          />
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="거래처별 미수금 TOP 12"
            subtitle="회수 우선순위 후보"
            right={`상위 12곳 합계 ${compactWon(total(byCustomer.slice(0, 12), (b) => b.value))}원`}
          />
          <BarsChart
            data={byCustomer.slice(0, 12).map((b) => ({ key: b.key, value: b.value }))}
            series={[{ key: "value", label: "미수 잔액" }]}
            layout="horizontal"
            categoryWidth={112}
            height={340}
            colors="var(--series-1)"
          />
        </Card>
      </div>

      <SectionTitle>담당자별 회수 현황</SectionTitle>
      <Card>
        <CardHeader title="담당자 회수율" subtitle="입금액 / 청구금액 · 연체 건수 병기" />
        <DataTable
          columns={[
            { key: "owner", header: "담당자", cell: (r) => <span className="font-medium text-ink">{r.owner}</span> },
            { key: "count", header: "청구건수", cell: (r) => `${r.count}건`, align: "right", numeric: true },
            { key: "billed", header: "청구금액", cell: (r) => num(r.billed), align: "right", numeric: true },
            { key: "paid", header: "입금액", cell: (r) => num(r.paid), align: "right", numeric: true },
            {
              key: "outstanding",
              header: "미수금",
              cell: (r) => <span className="font-semibold text-ink">{num(r.outstanding)}</span>,
              align: "right",
              numeric: true,
            },
            {
              key: "rate",
              header: "회수율",
              cell: (r) => <Meter value={r.rate} tone={r.rate >= 0.7 ? "good" : r.rate >= 0.4 ? "warning" : "critical"} label={`${r.owner} 회수율`} />,
              width: "180px",
            },
            {
              key: "late",
              header: "30일 초과 연체",
              cell: (r) =>
                r.lateCount ? (
                  <Badge tone={r.lateCount >= 3 ? "critical" : "warning"}>
                    {r.lateCount}건 · {compactWon(r.lateAmount)}
                  </Badge>
                ) : (
                  <Badge tone="good">없음</Badge>
                ),
            },
          ]}
          rows={owners}
          rowKey={(r) => r.owner}
          maxHeight="24rem"
        />
      </Card>

      <SectionTitle hint="경과일수 내림차순">채권 원장</SectionTitle>
      <Card>
        <CardHeader
          title="청구 / 입금 / 미수 상세"
          subtitle="05_채권_미수금 시트 (단위: 원)"
          right={`${receivables.length}건`}
        />
        <DataTable
          columns={columns}
          rows={[...receivables].sort((a, b) => b.overdueDays - a.overdueDays || b.outstanding - a.outstanding)}
          rowKey={(r) => r.invoiceNo}
          maxHeight="34rem"
        />
      </Card>
    </>
  );
}
