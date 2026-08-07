import { Card, CardHeader, SectionTitle } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/KpiCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Badge, type Tone } from "@/components/ui/Badge";
import { BarsChart } from "@/components/charts/BarsChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { FunnelBars } from "@/components/charts/FunnelBars";
import { getActivities, getCompany, getPipeline } from "@/lib/repository";
import { countBy, orderBuckets, sumBy, total } from "@/lib/aggregate";
import { compactWon, koDate, num, pct, won } from "@/lib/format";
import type { PipelineRow } from "@/lib/types";

const STAGE_ORDER = ["컨택", "미팅/데모", "제안", "견적/협상", "수주", "실주"] as const;
const RESULT_ORDER = ["긍정", "진전", "보통", "부정"] as const;

function idleTone(days: number): Tone {
  if (days > 30) return "critical";
  if (days > 14) return "serious";
  if (days > 7) return "warning";
  return "good";
}

export default async function PipelinePage() {
  const [company, pipeline, activities] = await Promise.all([
    getCompany(),
    getPipeline(),
    getActivities(),
  ]);

  const openDeals = pipeline.filter((d) => d.stage !== "수주" && d.stage !== "실주");
  const won_ = pipeline.filter((d) => d.stage === "수주");
  const lost = pipeline.filter((d) => d.stage === "실주");
  const pipelineTotal = total(pipeline, (d) => d.amount);
  const weightedTotal = total(pipeline, (d) => d.weightedAmount);
  const idle = openDeals.filter((d) => d.idleDays > 14);

  const stageAmount = orderBuckets(sumBy(pipeline, (d) => d.stage, (d) => d.amount), STAGE_ORDER);
  const stageWeighted = new Map(
    sumBy(pipeline, (d) => d.stage, (d) => d.weightedAmount).map((b) => [b.key, b.value]),
  );
  const stages = stageAmount
    .filter((b) => b.key !== "실주")
    .map((b) => ({
      stage: b.key,
      count: b.count,
      amount: b.value,
      weighted: stageWeighted.get(b.key) ?? 0,
    }));

  const byRep = sumBy(pipeline, (d) => d.rep, (d) => d.weightedAmount);
  const byIndustry = sumBy(pipeline, (d) => d.industry, (d) => d.amount);
  const byChannel = sumBy(pipeline, (d) => d.channel, (d) => d.amount);
  const byCompetitor = sumBy(pipeline, (d) => d.competitor, (d) => d.amount);

  // 활동 로그
  const activityByRep = countBy(activities, (a) => a.rep);
  const activityByType = countBy(activities, (a) => a.type);
  const resultMix = orderBuckets(countBy(activities, (a) => a.result), RESULT_ORDER);
  const positiveRate =
    (resultMix.find((r) => r.key === "긍정")?.value ?? 0) / (activities.length || 1);

  // 담당자별 활동 vs 가중 파이프라인
  const reps = [...new Set(pipeline.map((d) => d.rep))].map((rep) => {
    const deals = pipeline.filter((d) => d.rep === rep);
    const acts = activities.filter((a) => a.rep === rep);
    const openOnly = deals.filter((d) => d.stage !== "수주" && d.stage !== "실주");
    return {
      rep,
      team: deals[0]?.team ?? "",
      deals: deals.length,
      amount: total(deals, (d) => d.amount),
      weighted: total(deals, (d) => d.weightedAmount),
      wonAmount: total(deals.filter((d) => d.stage === "수주"), (d) => d.amount),
      activities: acts.length,
      minutes: total(acts, (a) => a.durationMin),
      idle: openOnly.filter((d) => d.idleDays > 14).length,
    };
  });
  reps.sort((a, b) => b.weighted - a.weighted);

  const dealColumns: Column<PipelineRow>[] = [
    { key: "id", header: "딜ID", cell: (r) => <span className="text-ink-muted">{r.dealId}</span>, width: "76px" },
    { key: "customer", header: "거래처", cell: (r) => <span className="font-medium text-ink">{r.customer}</span> },
    { key: "industry", header: "산업군", cell: (r) => r.industry },
    { key: "product", header: "제품군", cell: (r) => r.productGroup },
    {
      key: "stage",
      header: "단계",
      cell: (r) => (
        <span className="inline-flex items-center gap-1.5">
          <span
            className="size-2 rounded-[2px]"
            style={{ background: `var(--seq-${Math.min(STAGE_ORDER.indexOf(r.stage) + 1, 6)})` }}
            aria-hidden
          />
          {r.stage}
        </span>
      ),
    },
    { key: "prob", header: "확률", cell: (r) => pct(r.probability, 0), align: "right", numeric: true },
    { key: "amount", header: "예상금액", cell: (r) => num(r.amount), align: "right", numeric: true },
    {
      key: "weighted",
      header: "가중금액",
      cell: (r) => <span className="font-medium text-ink">{num(r.weightedAmount)}</span>,
      align: "right",
      numeric: true,
    },
    { key: "rep", header: "담당", cell: (r) => r.rep },
    {
      key: "idle",
      header: "미접촉",
      cell: (r) => <Badge tone={idleTone(r.idleDays)}>{r.idleDays}일</Badge>,
    },
    { key: "close", header: "예상마감", cell: (r) => r.expectedCloseAt.slice(2), width: "84px" },
    { key: "competitor", header: "경쟁사", cell: (r) => <span className="text-ink-muted">{r.competitor}</span> },
  ];

  return (
    <>
      <PageHeader
        title="영업 파이프라인"
        description="딜 단계별 기대매출과 방치된 딜, 담당자별 활동량을 함께 봅니다."
        meta={`기준일 ${koDate(company.baseDate)} · 딜 ${pipeline.length}건`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="파이프라인 총액"
          value={`${compactWon(pipelineTotal)}원`}
          hint={`딜 ${pipeline.length}건 · 진행중 ${openDeals.length}건`}
          accent="s1"
        />
        <KpiCard
          label="가중 예상매출"
          value={`${compactWon(weightedTotal)}원`}
          hint={`전체 대비 ${pct(weightedTotal / pipelineTotal, 0)} · 단계별 확률 반영`}
          accent="s3"
        />
        <KpiCard
          label="당월 수주"
          value={`${compactWon(total(won_, (d) => d.amount))}원`}
          hint={`${won_.length}건 · 실주 ${lost.length}건 (${compactWon(total(lost, (d) => d.amount))}원)`}
          accent="s6"
        />
        <KpiCard
          label="2주 이상 미접촉 딜"
          value={`${num(idle.length)}건`}
          hint={`금액 ${compactWon(total(idle, (d) => d.amount))}원 · 최장 ${Math.max(...idle.map((d) => d.idleDays))}일`}
          accent="critical"
        />
      </div>

      <SectionTitle hint="단계 순서는 순차 색상 램프로 표현">단계별 현황</SectionTitle>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="파이프라인 퍼널"
            subtitle="실주 제외 · 확률 가중 예상매출 병기"
            right={`가중 ${compactWon(weightedTotal)}원`}
          />
          <FunnelBars stages={stages} />
        </Card>

        <Card>
          <CardHeader title="담당자별 가중 예상매출" subtitle="확률 반영 기대값 기준" />
          <BarsChart
            data={byRep.map((b) => ({ key: b.key, value: b.value }))}
            series={[{ key: "value", label: "가중 예상매출" }]}
            layout="horizontal"
            categoryWidth={72}
            height={300}
            colors="var(--series-1)"
            labelled
            labelFormat="compactWon"
          />
        </Card>

        <Card>
          <CardHeader title="산업군별 파이프라인" subtitle="예상금액 기준 상위 6개" />
          <DonutChart
            data={byIndustry.slice(0, 6).map((b) => ({ key: b.key, value: b.value }))}
            centerLabel="파이프라인"
            centerValue={`${compactWon(pipelineTotal)}원`}
            height={220}
          />
        </Card>

        <Card>
          <CardHeader title="유입채널별 파이프라인" subtitle="딜 소싱 경로" />
          <BarsChart
            data={byChannel.map((b) => ({ key: b.key, value: b.value }))}
            series={[{ key: "value", label: "예상금액" }]}
            layout="horizontal"
            categoryWidth={92}
            height={220}
            colors="var(--series-2)"
          />
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="경쟁사별 대치 금액"
            subtitle="딜에 등장한 경쟁사 기준 예상금액 합계"
          />
          <BarsChart
            data={byCompetitor.map((b) => ({ key: b.key, value: b.value }))}
            series={[{ key: "value", label: "예상금액" }]}
            height={220}
            colors={byCompetitor.map((b) => (b.key === "없음" ? "var(--seq-1)" : "var(--series-4)"))}
            labelled
            labelFormat="compactWon"
          />
        </Card>
      </div>

      <SectionTitle hint={`${activities.length}건 · 총 ${num(Math.round(total(activities, (a) => a.durationMin) / 60))}시간`}>
        영업 활동
      </SectionTitle>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="활동 유형별 건수" subtitle="07_영업_활동로그" />
          <BarsChart
            data={activityByType.map((b) => ({ key: b.key, value: b.value }))}
            series={[{ key: "value", label: "건수" }]}
            layout="horizontal"
            categoryWidth={80}
            height={220}
            valueFormat="number"
            tooltipFormat="count"
            colors="var(--series-3)"
          />
        </Card>

        <Card>
          <CardHeader title="활동 결과 분포" subtitle={`긍정 비율 ${pct(positiveRate, 0)}`} />
          <DonutChart
            data={resultMix.map((b) => ({
              key: b.key,
              value: b.value,
              color:
                b.key === "긍정"
                  ? "var(--good)"
                  : b.key === "진전"
                    ? "var(--series-1)"
                    : b.key === "보통"
                      ? "var(--seq-1)"
                      : "var(--critical)",
            }))}
            centerLabel="총 활동"
            centerValue={`${num(activities.length)}건`}
            height={200}
            valueFormat="count"
            tooltipFormat="count"
          />
        </Card>

        <Card>
          <CardHeader title="담당자별 활동 건수" subtitle="접촉 빈도" />
          <BarsChart
            data={activityByRep.map((b) => ({ key: b.key, value: b.value }))}
            series={[{ key: "value", label: "활동" }]}
            layout="horizontal"
            categoryWidth={64}
            height={220}
            valueFormat="number"
            tooltipFormat="count"
            colors="var(--series-5)"
          />
        </Card>
      </div>

      <div className="mt-4">
        <Card>
          <CardHeader title="담당자 종합" subtitle="파이프라인 · 활동량 · 방치 딜을 함께 비교" />
          <DataTable
            columns={[
              { key: "rep", header: "담당자", cell: (r) => <span className="font-medium text-ink">{r.rep}</span> },
              { key: "team", header: "부서", cell: (r) => r.team },
              { key: "deals", header: "딜", cell: (r) => `${r.deals}건`, align: "right", numeric: true },
              { key: "amount", header: "예상금액", cell: (r) => num(r.amount), align: "right", numeric: true },
              {
                key: "weighted",
                header: "가중 예상매출",
                cell: (r) => <span className="font-semibold text-ink">{num(r.weighted)}</span>,
                align: "right",
                numeric: true,
              },
              { key: "won", header: "수주금액", cell: (r) => num(r.wonAmount), align: "right", numeric: true },
              { key: "acts", header: "활동", cell: (r) => `${r.activities}건`, align: "right", numeric: true },
              {
                key: "minutes",
                header: "접촉시간",
                cell: (r) => `${num(Math.round(r.minutes / 60))}시간`,
                align: "right",
                numeric: true,
              },
              {
                key: "idle",
                header: "방치 딜",
                cell: (r) =>
                  r.idle ? <Badge tone={r.idle >= 5 ? "critical" : "warning"}>{r.idle}건</Badge> : <Badge tone="good">없음</Badge>,
              },
            ]}
            rows={reps}
            rowKey={(r) => r.rep}
            maxHeight="24rem"
          />
        </Card>
      </div>

      <SectionTitle hint="미접촉일수 내림차순 — 상단이 가장 방치된 딜">딜 목록</SectionTitle>
      <Card>
        <CardHeader
          title="전체 딜"
          subtitle="06_영업_파이프라인 (단위: 원)"
          right={`총 ${won(pipelineTotal)}`}
        />
        <DataTable
          columns={dealColumns}
          rows={[...pipeline].sort((a, b) => b.idleDays - a.idleDays)}
          rowKey={(r) => r.dealId}
          maxHeight="34rem"
        />
      </Card>
    </>
  );
}
