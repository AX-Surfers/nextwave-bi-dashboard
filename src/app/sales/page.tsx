import { Card, CardHeader, SectionTitle } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/KpiCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { TrendChart } from "@/components/charts/TrendChart";
import { BarsChart } from "@/components/charts/BarsChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { getCompany, getIncomeStatement, getSales } from "@/lib/repository";
import { byDate, mean, sumBy, topNWithOther, total } from "@/lib/aggregate";
import { compactWon, koDate, num, shortDate, won } from "@/lib/format";
import type { SalesRow } from "@/lib/types";

const CATEGORIES = ["SaaS구독", "하드웨어", "용역", "유지보수"] as const;

export default async function SalesPage() {
  const [company, sales, pl] = await Promise.all([getCompany(), getSales(), getIncomeStatement()]);

  const revenue = total(sales, (r) => r.supplyAmount);

  // 일자 × 카테고리 누적 시계열
  const dates = [...new Set(sales.map((r) => r.date))].sort();
  const stacked = dates.map((date) => {
    const row: Record<string, string | number> = { date };
    for (const cat of CATEGORIES) {
      row[cat] = sales
        .filter((r) => r.date === date && r.category === cat)
        .reduce((a, b) => a + b.supplyAmount, 0);
    }
    return row;
  });

  const byCategory = sumBy(sales, (r) => r.category, (r) => r.supplyAmount);
  const byProduct = sumBy(sales, (r) => r.product, (r) => r.supplyAmount);
  const byCustomer = sumBy(sales, (r) => r.customer, (r) => r.supplyAmount);
  const byRep = sumBy(sales, (r) => r.rep, (r) => r.supplyAmount);
  const byTeam = sumBy(sales, (r) => r.team, (r) => r.supplyAmount);
  const byChannel = sumBy(sales, (r) => r.channel, (r) => r.supplyAmount);
  const byIndustry = topNWithOther(sumBy(sales, (r) => r.industry, (r) => r.supplyAmount), 7);
  const byRegion = sumBy(sales, (r) => r.region, (r) => r.supplyAmount);

  const daily = byDate(sales, (r) => r.date, (r) => r.supplyAmount);
  const bestDay = [...daily].sort((a, b) => b.value - a.value)[0];

  // 담당자별 카테고리 믹스 (누적 막대)
  const repMix = byRep.map((r) => {
    const rows = sales.filter((s) => s.rep === r.key);
    const out: Record<string, string | number> = { key: r.key };
    for (const cat of CATEGORIES) {
      out[cat] = rows.filter((s) => s.category === cat).reduce((a, b) => a + b.supplyAmount, 0);
    }
    return out;
  });

  const topRows = [...sales].sort((a, b) => b.supplyAmount - a.supplyAmount).slice(0, 25);

  const columns: Column<SalesRow>[] = [
    { key: "date", header: "일자", cell: (r) => shortDate(r.date), width: "68px" },
    { key: "voucher", header: "전표번호", cell: (r) => <span className="text-ink-muted">{r.voucherNo}</span> },
    { key: "customer", header: "거래처", cell: (r) => <span className="font-medium text-ink">{r.customer}</span> },
    { key: "product", header: "제품", cell: (r) => r.product },
    {
      key: "category",
      header: "카테고리",
      cell: (r) => (
        <span className="inline-flex items-center gap-1.5">
          <span
            className="size-2 rounded-[2px]"
            style={{ background: `var(--series-${CATEGORIES.indexOf(r.category) + 1})` }}
            aria-hidden
          />
          {r.category}
        </span>
      ),
    },
    { key: "qty", header: "수량", cell: (r) => num(r.qty), align: "right", numeric: true },
    { key: "unit", header: "단가", cell: (r) => num(r.unitPrice), align: "right", numeric: true },
    {
      key: "supply",
      header: "공급가액",
      cell: (r) => <span className="font-medium text-ink">{num(r.supplyAmount)}</span>,
      align: "right",
      numeric: true,
    },
    { key: "rep", header: "담당", cell: (r) => r.rep },
    { key: "channel", header: "유입채널", cell: (r) => <span className="text-ink-muted">{r.channel}</span> },
  ];

  return (
    <>
      <PageHeader
        title="매출 분석"
        description="제품·거래처·담당자·채널 축으로 7월 매출을 드릴다운합니다."
        meta={`${koDate(company.periodStart)} ~ ${koDate(company.periodEnd)}`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="매출액 (공급가액)"
          value={`${compactWon(revenue)}원`}
          delta={(revenue - pl.totals.revenue.previous) / pl.totals.revenue.previous}
          hint={`부가세 포함 ${compactWon(total(sales, (r) => r.total))}원`}
          accent="s1"
          sparkline={daily.slice(-12).map((d) => d.value)}
        />
        <KpiCard
          label="거래 건수"
          value={`${num(sales.length)}건`}
          hint={`거래처 ${new Set(sales.map((r) => r.customer)).size}곳 · 제품 ${new Set(sales.map((r) => r.product)).size}종`}
          accent="s2"
        />
        <KpiCard
          label="건당 평균 매출"
          value={`${compactWon(mean(sales, (r) => r.supplyAmount))}원`}
          hint={`최대 단일 거래 ${compactWon(Math.max(...sales.map((r) => r.supplyAmount)))}원`}
          accent="s3"
        />
        <KpiCard
          label="일 최고 매출"
          value={`${compactWon(bestDay.value)}원`}
          hint={`${shortDate(bestDay.date)} · ${bestDay.count}건`}
          accent="s4"
        />
      </div>

      <SectionTitle hint="카테고리를 쌓아 총액과 구성을 동시에 확인">일별 매출 추이</SectionTitle>
      <Card>
        <CardHeader
          title="일별 매출 (카테고리 누적)"
          subtitle="01_매출상세 공급가액 기준"
          right={`${dates.length}일 · ${num(sales.length)}건`}
        />
        <TrendChart
          data={stacked}
          series={CATEGORIES.map((c) => ({ key: c, label: c, kind: "area" as const }))}
          stacked
          xFormat="shortDate"
          height={280}
        />
      </Card>

      <SectionTitle>구성 분석</SectionTitle>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="카테고리별 매출" subtitle="사업 구조 비중" />
          <DonutChart
            data={byCategory.map((c) => ({ key: c.key, value: c.value }))}
            centerLabel="총 매출"
            centerValue={`${compactWon(revenue)}원`}
          />
        </Card>

        <Card>
          <CardHeader title="유입채널별 매출" subtitle="채널 효율 비교" />
          <BarsChart
            data={byChannel.map((c) => ({ key: c.key, value: c.value }))}
            series={[{ key: "value", label: "매출" }]}
            layout="horizontal"
            categoryWidth={92}
            height={220}
            labelled
            labelFormat="compactWon"
            colors="var(--series-1)"
          />
        </Card>

        <Card>
          <CardHeader title="제품별 매출 TOP 10" subtitle="공급가액 기준" />
          <BarsChart
            data={byProduct.slice(0, 10).map((c) => ({ key: c.key, value: c.value }))}
            series={[{ key: "value", label: "매출" }]}
            layout="horizontal"
            categoryWidth={168}
            height={300}
            colors="var(--series-1)"
          />
        </Card>

        <Card>
          <CardHeader title="거래처별 매출 TOP 10" subtitle="공급가액 기준" />
          <BarsChart
            data={byCustomer.slice(0, 10).map((c) => ({ key: c.key, value: c.value }))}
            series={[{ key: "value", label: "매출" }]}
            layout="horizontal"
            categoryWidth={112}
            height={300}
            colors="var(--series-2)"
          />
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="영업담당자별 매출 구성"
            subtitle="담당자별 카테고리 믹스 — 특정 카테고리 편중 여부 확인"
            right={`${byTeam.map((t) => `${t.key} ${compactWon(t.value)}`).join(" · ")}`}
          />
          <BarsChart
            data={repMix}
            series={CATEGORIES.map((c) => ({ key: c, label: c }))}
            stacked
            height={280}
          />
        </Card>

        <Card>
          <CardHeader title="산업군별 매출" subtitle="상위 7개 + 기타" />
          <BarsChart
            data={byIndustry.map((c) => ({ key: c.key, value: c.value }))}
            series={[{ key: "value", label: "매출" }]}
            layout="horizontal"
            categoryWidth={92}
            height={280}
            colors={byIndustry.map((b) => (b.key === "기타" ? "var(--seq-1)" : "var(--series-3)"))}
          />
        </Card>

        <Card>
          <CardHeader title="지역별 매출 TOP 10" subtitle="거래처 소재지 기준" />
          <BarsChart
            data={byRegion.slice(0, 10).map((c) => ({ key: c.key, value: c.value }))}
            series={[{ key: "value", label: "매출" }]}
            layout="horizontal"
            categoryWidth={64}
            height={280}
            colors="var(--series-4)"
          />
        </Card>
      </div>

      <SectionTitle hint="공급가액 상위 25건">매출 상세</SectionTitle>
      <Card>
        <CardHeader
          title="매출 원장"
          subtitle="01_매출상세 시트 (단위: 원)"
          right={`총 ${won(revenue)} 중 상위 25건`}
        />
        <DataTable columns={columns} rows={topRows} rowKey={(r) => r.voucherNo} maxHeight="32rem" />
      </Card>
    </>
  );
}
