import { Card, CardHeader, SectionTitle } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/KpiCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Badge, riskTone, taskStatusTone } from "@/components/ui/Badge";
import { Meter } from "@/components/ui/Meter";
import { BarsChart } from "@/components/charts/BarsChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { ScatterPlot, type Point } from "@/components/charts/ScatterPlot";
import { getCompany, getProjects, getTasks } from "@/lib/repository";
import { countBy, sumBy, total } from "@/lib/aggregate";
import { compactWon, koDate, num, pct, won } from "@/lib/format";
import type { ProjectRow, TaskRow } from "@/lib/types";

const RISK_COLOR: Record<string, string> = {
  높음: "var(--critical)",
  보통: "var(--warning)",
  낮음: "var(--good)",
};

export default async function ProjectsPage() {
  const [company, projects, tasks] = await Promise.all([getCompany(), getProjects(), getTasks()]);

  const budget = total(projects, (p) => p.budget);
  const spent = total(projects, (p) => p.spent);
  const contract = total(projects, (p) => p.contractAmount);
  const overBudget = projects.filter((p) => p.budgetUsage > 1);
  const highRisk = projects.filter((p) => p.risk === "높음");
  const delayed = tasks.filter((t) => t.delayDays > 0);
  const done = tasks.filter((t) => t.status === "완료");

  const points: Point[] = projects.map((p) => ({
    name: p.name,
    x: p.progress,
    y: p.budgetUsage,
    z: p.contractAmount,
    color: RISK_COLOR[p.risk] ?? "var(--series-1)",
    meta: [
      { label: "계약금액", value: `${compactWon(p.contractAmount)}원` },
      { label: "예산", value: `${compactWon(p.budget)}원` },
      { label: "투입비용", value: `${compactWon(p.spent)}원` },
      { label: "리스크", value: p.risk },
      { label: "잔여일수", value: `${p.daysLeft}일` },
    ],
  }));

  const byType = sumBy(projects, (p) => p.type, (p) => p.contractAmount);
  const byDept = sumBy(projects, (p) => p.dept, (p) => p.contractAmount);
  const taskStatus = countBy(tasks, (t) => t.status);
  const taskByDept = [...new Set(tasks.map((t) => t.dept))]
    .map((dept) => {
      const rows = tasks.filter((t) => t.dept === dept);
      return {
        key: dept,
        완료: rows.filter((t) => t.status === "완료").length,
        진행중: rows.filter((t) => t.status === "진행중").length,
        지연: rows.filter((t) => t.delayDays > 0 && t.status !== "완료").length,
      };
    })
    .sort((a, b) => b.완료 + b.진행중 + b.지연 - (a.완료 + a.진행중 + a.지연));

  const projectColumns: Column<ProjectRow>[] = [
    { key: "code", header: "코드", cell: (r) => <span className="text-ink-muted">{r.code}</span>, width: "104px" },
    { key: "name", header: "프로젝트", cell: (r) => <span className="font-medium text-ink">{r.name}</span> },
    { key: "pm", header: "PM", cell: (r) => r.pm },
    { key: "dept", header: "담당부서", cell: (r) => r.dept },
    { key: "type", header: "구분", cell: (r) => r.type },
    {
      key: "progress",
      header: "진행률",
      cell: (r) => <Meter value={r.progress} tone="neutral" label={`${r.name} 진행률`} />,
      width: "150px",
    },
    {
      key: "usage",
      header: "예산소진율",
      cell: (r) => <Meter value={r.budgetUsage} label={`${r.name} 예산소진율`} />,
      width: "150px",
    },
    { key: "contract", header: "계약금액", cell: (r) => num(r.contractAmount), align: "right", numeric: true },
    {
      key: "left",
      header: "잔여예산",
      cell: (r) => (
        <span className={r.budgetLeft < 0 ? "font-semibold text-[var(--delta-down)]" : ""}>
          {num(r.budgetLeft)}
        </span>
      ),
      align: "right",
      numeric: true,
    },
    {
      key: "days",
      header: "잔여일수",
      cell: (r) =>
        r.daysLeft < 0 ? <Badge tone="critical">{Math.abs(r.daysLeft)}일 초과</Badge> : `${r.daysLeft}일`,
      align: "left",
    },
    { key: "risk", header: "리스크", cell: (r) => <Badge tone={riskTone(r.risk)}>{r.risk}</Badge> },
    { key: "issue", header: "이슈", cell: (r) => <span className="text-ink-muted">{r.issue}</span> },
  ];

  const taskColumns: Column<TaskRow>[] = [
    { key: "id", header: "태스크", cell: (r) => <span className="text-ink-muted">{r.taskId}</span>, width: "76px" },
    { key: "name", header: "업무명", cell: (r) => <span className="font-medium text-ink">{r.name}</span> },
    { key: "project", header: "프로젝트", cell: (r) => <span className="text-ink-muted">{r.projectCode}</span> },
    { key: "owner", header: "담당", cell: (r) => r.owner },
    { key: "dept", header: "부서", cell: (r) => r.dept },
    {
      key: "priority",
      header: "우선순위",
      cell: (r) => (
        <Badge tone={r.priority === "높음" ? "critical" : r.priority === "보통" ? "warning" : "neutral"}>
          {r.priority}
        </Badge>
      ),
    },
    { key: "status", header: "상태", cell: (r) => <Badge tone={taskStatusTone(r.status)}>{r.status}</Badge> },
    { key: "due", header: "마감일", cell: (r) => r.dueAt.slice(5), width: "76px" },
    {
      key: "progress",
      header: "진행률",
      cell: (r) => <Meter value={r.progress} tone="neutral" label={`${r.name} 진행률`} />,
      width: "140px",
    },
    {
      key: "hours",
      header: "공수 (예상/실투입)",
      cell: (r) => (
        <span className={r.actualHours > r.estimatedHours ? "text-[var(--delta-down)]" : ""}>
          {num(r.estimatedHours)} / {num(r.actualHours)}h
        </span>
      ),
      align: "right",
      numeric: true,
    },
    {
      key: "delay",
      header: "지연",
      cell: (r) =>
        r.delayDays > 0 ? (
          <Badge tone={r.delayDays > 14 ? "critical" : "warning"}>{r.delayDays}일</Badge>
        ) : (
          <span className="text-ink-muted">정상</span>
        ),
    },
  ];

  return (
    <>
      <PageHeader
        title="프로젝트"
        description="진행률 대비 예산 소진, 리스크 등급, 지연 태스크를 한 화면에서 점검합니다."
        meta={`프로젝트 ${projects.length}건 · 태스크 ${tasks.length}건 · 기준일 ${koDate(company.baseDate)}`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="계약금액 합계"
          value={`${compactWon(contract)}원`}
          hint={`진행중 ${projects.filter((p) => p.status === "진행중").length}건`}
          accent="s1"
        />
        <KpiCard
          label="예산 소진율"
          value={pct(spent / budget)}
          hint={`투입 ${compactWon(spent)}원 / 예산 ${compactWon(budget)}원`}
          accent="s4"
        />
        <KpiCard
          label="예산 초과 프로젝트"
          value={`${num(overBudget.length)}건`}
          hint={`초과액 합계 ${compactWon(Math.abs(total(overBudget, (p) => p.budgetLeft)))}원`}
          accent="critical"
        />
        <KpiCard
          label="지연 태스크"
          value={`${num(delayed.length)}건`}
          hint={`완료 ${done.length}건 · 평균 진행률 ${pct(total(tasks, (t) => t.progress) / tasks.length, 1)}`}
          accent="warning"
        />
      </div>

      <SectionTitle hint="대각선 위쪽 = 진행률보다 예산을 빨리 쓰는 프로젝트">
        진행률 × 예산 소진율
      </SectionTitle>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="프로젝트 건전성 맵"
            subtitle="점 크기 = 계약금액 · 대각선 위쪽은 예산 과소진, 가로 100% 선은 예산 소진 완료"
            right={`고위험 ${highRisk.length}건`}
          />
          <ScatterPlot
            points={points}
            xLabel="진행률"
            yLabel="예산 소진율"
            height={340}
            legend={[
              { label: "리스크 높음", color: RISK_COLOR["높음"] },
              { label: "리스크 보통", color: RISK_COLOR["보통"] },
              { label: "리스크 낮음", color: RISK_COLOR["낮음"] },
            ]}
          />
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="리스크 등급 분포" subtitle="11_업무_프로젝트" />
            <DonutChart
              data={countBy(projects, (p) => p.risk).map((b) => ({
                key: b.key,
                value: b.value,
                color: RISK_COLOR[b.key],
              }))}
              centerLabel="프로젝트"
              centerValue={`${projects.length}건`}
              height={180}
              valueFormat="count"
              tooltipFormat="count"
            />
          </Card>
          <Card>
            <CardHeader title="태스크 상태" subtitle="12_업무_태스크" />
            <DonutChart
              data={taskStatus.map((b) => ({
                key: b.key,
                value: b.value,
                color:
                  b.key === "완료"
                    ? "var(--good)"
                    : b.key === "진행중"
                      ? "var(--series-1)"
                      : b.key === "보류"
                        ? "var(--serious)"
                        : "var(--seq-1)",
              }))}
              centerLabel="총 태스크"
              centerValue={`${tasks.length}건`}
              height={180}
              valueFormat="count"
              tooltipFormat="count"
            />
          </Card>
        </div>
      </div>

      <SectionTitle>포트폴리오 구성</SectionTitle>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="구분별 계약금액" subtitle="신규구축 · 고도화 · PoC · 마이그레이션 · 유지보수" />
          <BarsChart
            data={byType.map((b) => ({ key: b.key, value: b.value }))}
            series={[{ key: "value", label: "계약금액" }]}
            layout="horizontal"
            categoryWidth={96}
            height={220}
            colors="var(--series-1)"
            labelled
            labelFormat="compactWon"
          />
        </Card>

        <Card>
          <CardHeader title="담당부서별 계약금액" subtitle="수행 조직 기준" />
          <BarsChart
            data={byDept.map((b) => ({ key: b.key, value: b.value }))}
            series={[{ key: "value", label: "계약금액" }]}
            layout="horizontal"
            categoryWidth={112}
            height={220}
            colors="var(--series-3)"
          />
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="부서별 태스크 상태"
            subtitle="지연은 완료되지 않은 채 마감일이 지난 태스크"
            right={`지연 ${delayed.length}건`}
          />
          <BarsChart
            data={taskByDept}
            series={[
              { key: "완료", label: "완료", color: "var(--good)" },
              { key: "진행중", label: "진행중", color: "var(--series-1)" },
              { key: "지연", label: "지연", color: "var(--critical)" },
            ]}
            stacked
            height={260}
            valueFormat="number"
            tooltipFormat="count"
          />
        </Card>
      </div>

      <SectionTitle hint="예산소진율 내림차순 — 상단이 예산 위험군">프로젝트 목록</SectionTitle>
      <Card>
        <CardHeader
          title="전체 프로젝트"
          subtitle="11_업무_프로젝트 (단위: 원)"
          right={`계약금액 합계 ${won(contract)}`}
        />
        <DataTable
          columns={projectColumns}
          rows={[...projects].sort((a, b) => b.budgetUsage - a.budgetUsage)}
          rowKey={(r) => r.code}
          maxHeight="34rem"
        />
      </Card>

      <SectionTitle hint="지연일수 내림차순">지연 태스크</SectionTitle>
      <Card>
        <CardHeader
          title="지연 중인 태스크"
          subtitle="마감일이 지났거나 완료가 늦어진 태스크"
          right={`${delayed.length}건 / 전체 ${tasks.length}건`}
        />
        <DataTable
          columns={taskColumns}
          rows={[...delayed].sort((a, b) => b.delayDays - a.delayDays)}
          rowKey={(r) => r.taskId}
          maxHeight="32rem"
        />
      </Card>
    </>
  );
}
