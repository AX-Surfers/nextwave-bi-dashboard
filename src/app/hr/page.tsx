import { Card, CardHeader, SectionTitle } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/KpiCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Badge, type Tone } from "@/components/ui/Badge";
import { BarsChart } from "@/components/charts/BarsChart";
import { DonutChart } from "@/components/charts/DonutChart";
import {
  getAttendance,
  getCompany,
  getEmployees,
  getIncomeStatement,
  getPayroll,
} from "@/lib/repository";
import { countBy, mean, total } from "@/lib/aggregate";
import { compactWon, koDate, num, pct, won } from "@/lib/format";

const RANK_ORDER = ["사원", "주임", "대리", "과장", "차장", "부장", "이사"];

function overtimeTone(hours: number): Tone {
  if (hours >= 25) return "critical";
  if (hours >= 15) return "warning";
  return "good";
}

export default async function HrPage() {
  const [company, employees, payroll, attendance, pl] = await Promise.all([
    getCompany(),
    getEmployees(),
    getPayroll(),
    getAttendance(),
    getIncomeStatement(),
  ]);

  const active = employees.filter((e) => e.status === "재직");
  const resigned = employees.filter((e) => e.status !== "재직");

  const grossTotal = total(payroll, (p) => p.grossPay);
  const netTotal = total(payroll, (p) => p.netPay);
  const deductionTotal = total(payroll, (p) => p.totalDeduction);
  const overtimeTotal = total(attendance, (a) => a.overtimeHours);

  // 부서별
  const deptRows = [...new Set(employees.map((e) => e.dept))].map((dept) => {
    const emps = active.filter((e) => e.dept === dept);
    const pays = payroll.filter((p) => p.dept === dept);
    const atts = attendance.filter((a) => a.dept === dept);
    return {
      dept,
      headcount: emps.length,
      salaryTotal: total(emps, (e) => e.annualSalary),
      avgSalary: emps.length ? total(emps, (e) => e.annualSalary) / emps.length : 0,
      grossPay: total(pays, (p) => p.grossPay),
      overtime: total(atts, (a) => a.overtimeHours),
      avgOvertime: atts.length ? total(atts, (a) => a.overtimeHours) / atts.length : 0,
      avgTenure: emps.length ? total(emps, (e) => e.tenureMonths) / emps.length : 0,
    };
  });
  deptRows.sort((a, b) => b.headcount - a.headcount);

  const byRank = countBy(active, (e) => e.rank).sort(
    (a, b) => RANK_ORDER.indexOf(a.key) - RANK_ORDER.indexOf(b.key),
  );
  const byWorkplace = countBy(active, (e) => e.workplace);

  // 근속 분포
  const tenureBuckets = [
    { key: "1년 미만", test: (m: number) => m < 12 },
    { key: "1~2년", test: (m: number) => m >= 12 && m < 24 },
    { key: "2~3년", test: (m: number) => m >= 24 && m < 36 },
    { key: "3~5년", test: (m: number) => m >= 36 && m < 60 },
    { key: "5년 이상", test: (m: number) => m >= 60 },
  ].map((b) => ({ key: b.key, value: active.filter((e) => b.test(e.tenureMonths)).length }));

  // 급여 구성
  const payComposition = [
    { key: "기본급", value: total(payroll, (p) => p.baseSalary) },
    { key: "식대", value: total(payroll, (p) => p.mealAllowance) },
    { key: "직책수당", value: total(payroll, (p) => p.positionAllowance) },
    { key: "연장수당", value: total(payroll, (p) => p.overtimePay) },
  ];
  const deductionComposition = [
    { key: "국민연금", value: total(payroll, (p) => p.pension) },
    { key: "건강보험", value: total(payroll, (p) => p.health) },
    { key: "장기요양", value: total(payroll, (p) => p.longTermCare) },
    { key: "고용보험", value: total(payroll, (p) => p.employmentIns) },
    { key: "소득세", value: total(payroll, (p) => p.incomeTax) },
    { key: "지방소득세", value: total(payroll, (p) => p.localTax) },
  ];

  // 근태 경고
  const heavyOvertime = [...attendance].sort((a, b) => b.overtimeHours - a.overtimeHours);
  const lateAlert = attendance.filter((a) => a.lateCount >= 3);
  const absent = attendance.filter((a) => a.absenceDays > 0);

  const attColumns: Column<(typeof attendance)[number]>[] = [
    { key: "name", header: "성명", cell: (r) => <span className="font-medium text-ink">{r.name}</span> },
    { key: "dept", header: "부서", cell: (r) => r.dept },
    {
      key: "ot",
      header: "연장근로",
      cell: (r) => <Badge tone={overtimeTone(r.overtimeHours)}>{r.overtimeHours}시간</Badge>,
      align: "left",
    },
    { key: "night", header: "야간근로", cell: (r) => `${r.nightHours}h`, align: "right", numeric: true },
    { key: "days", header: "실근무일", cell: (r) => `${r.actualDays}일`, align: "right", numeric: true },
    { key: "leave", header: "연차사용", cell: (r) => `${r.annualLeaveUsed}일`, align: "right", numeric: true },
    { key: "left", header: "잔여연차", cell: (r) => `${r.annualLeaveLeft}일`, align: "right", numeric: true },
    {
      key: "late",
      header: "지각",
      cell: (r) => (r.lateCount >= 3 ? <Badge tone="warning">{r.lateCount}회</Badge> : `${r.lateCount}회`),
      align: "left",
    },
    {
      key: "absence",
      header: "결근",
      cell: (r) => (r.absenceDays > 0 ? <Badge tone="critical">{r.absenceDays}일</Badge> : "—"),
      align: "left",
    },
    { key: "remote", header: "재택", cell: (r) => `${r.remoteDays}일`, align: "right", numeric: true },
    { key: "hours", header: "총근로시간", cell: (r) => `${num(r.totalWorkHours)}h`, align: "right", numeric: true },
  ];

  const payColumns: Column<(typeof payroll)[number]>[] = [
    { key: "no", header: "사번", cell: (r) => <span className="text-ink-muted">{r.empNo}</span>, width: "76px" },
    { key: "name", header: "성명", cell: (r) => <span className="font-medium text-ink">{r.name}</span> },
    { key: "dept", header: "부서", cell: (r) => r.dept },
    { key: "base", header: "기본급", cell: (r) => num(r.baseSalary), align: "right", numeric: true },
    { key: "ot", header: "연장수당", cell: (r) => num(r.overtimePay), align: "right", numeric: true },
    {
      key: "gross",
      header: "지급총액",
      cell: (r) => <span className="font-semibold text-ink">{num(r.grossPay)}</span>,
      align: "right",
      numeric: true,
    },
    { key: "ded", header: "공제총액", cell: (r) => num(r.totalDeduction), align: "right", numeric: true },
    { key: "tax", header: "소득세", cell: (r) => num(r.incomeTax), align: "right", numeric: true },
    { key: "net", header: "실지급액", cell: (r) => <span className="font-medium text-ink">{num(r.netPay)}</span>, align: "right", numeric: true },
  ];

  return (
    <>
      <PageHeader
        title="인사 / 급여"
        description="인력 구성과 7월 급여·근태를 부서 단위로 확인합니다."
        meta={`재직 ${active.length}명 · 기준일 ${koDate(company.baseDate)}`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="재직 인원"
          value={`${num(active.length)}명`}
          hint={`7월 퇴사 ${resigned.length}명 · ${deptRows.length}개 부서`}
          accent="s1"
        />
        <KpiCard
          label="7월 급여 지급총액"
          value={`${compactWon(grossTotal)}원`}
          hint={`매출 대비 ${pct(grossTotal / pl.totals.revenue.current)} · 실지급 ${compactWon(netTotal)}원`}
          accent="s5"
        />
        <KpiCard
          label="평균 근속"
          value={`${mean(active, (e) => e.tenureMonths).toFixed(1)}개월`}
          hint={`평균 연봉 ${compactWon(mean(active, (e) => e.annualSalary))}원`}
          accent="s3"
        />
        <KpiCard
          label="총 연장근로"
          value={`${num(overtimeTotal)}시간`}
          hint={`1인 평균 ${(overtimeTotal / attendance.length).toFixed(1)}시간 · 25시간 이상 ${attendance.filter((a) => a.overtimeHours >= 25).length}명`}
          accent="warning"
        />
      </div>

      <SectionTitle>인력 구성</SectionTitle>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="부서별 인원 및 인건비" subtitle="재직자 기준 · 연봉 합계" />
          <BarsChart
            data={deptRows.map((d) => ({ key: d.dept, 인원: d.headcount }))}
            series={[{ key: "인원", label: "인원" }]}
            layout="horizontal"
            categoryWidth={104}
            height={320}
            valueFormat="number"
            tooltipFormat="people"
            colors="var(--series-1)"
            labelled
            labelFormat="people"
          />
        </Card>

        <Card>
          <CardHeader title="직급 분포" subtitle="재직자 기준" />
          <BarsChart
            data={byRank.map((b) => ({ key: b.key, value: b.value }))}
            series={[{ key: "value", label: "인원" }]}
            height={150}
            valueFormat="number"
            tooltipFormat="people"
            colors="var(--series-3)"
          />
          <div className="mt-4 border-t border-line pt-4">
            <p className="mb-2 text-xs font-medium text-ink-secondary">근무지</p>
            <ul className="space-y-1.5">
              {byWorkplace.map((w, i) => (
                <li key={w.key} className="flex items-center gap-2 text-sm">
                  <span
                    className="size-2.5 rounded-[3px]"
                    style={{ background: `var(--series-${i + 1})` }}
                    aria-hidden
                  />
                  <span className="flex-1 text-ink-secondary">{w.key}</span>
                  <span className="tabular-nums text-ink">{w.value}명</span>
                  <span className="w-12 text-right tabular-nums text-ink-muted">
                    {pct(w.value / active.length, 0)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <Card>
          <CardHeader title="근속 분포" subtitle="기준일 대비 근속개월" />
          <BarsChart
            data={tenureBuckets}
            series={[{ key: "value", label: "인원" }]}
            height={200}
            valueFormat="number"
            tooltipFormat="people"
            colors={tenureBuckets.map((_, i) => `var(--seq-${Math.min(i + 2, 6)})`)}
            labelled
            labelFormat="people"
          />
        </Card>

        <Card>
          <CardHeader title="급여 지급 구성" subtitle="7월 지급총액 기준" />
          <DonutChart
            data={payComposition}
            centerLabel="지급총액"
            centerValue={`${compactWon(grossTotal)}원`}
            height={200}
          />
        </Card>

        <Card>
          <CardHeader title="공제 구성" subtitle={`공제총액 ${compactWon(deductionTotal)}원`} />
          <DonutChart
            data={deductionComposition}
            centerLabel="공제총액"
            centerValue={`${compactWon(deductionTotal)}원`}
            height={200}
          />
        </Card>
      </div>

      <SectionTitle hint="인원·인건비·근속·연장근로 종합">부서 현황</SectionTitle>
      <Card>
        <CardHeader title="부서별 종합" subtitle="08_인사_직원명부 · 09_급여대장 · 10_근태현황" />
        <DataTable
          columns={[
            { key: "dept", header: "부서", cell: (r) => <span className="font-medium text-ink">{r.dept}</span> },
            { key: "head", header: "인원", cell: (r) => `${r.headcount}명`, align: "right", numeric: true },
            { key: "salary", header: "연봉 합계", cell: (r) => num(r.salaryTotal), align: "right", numeric: true },
            { key: "avg", header: "평균 연봉", cell: (r) => num(Math.round(r.avgSalary)), align: "right", numeric: true },
            {
              key: "gross",
              header: "7월 지급총액",
              cell: (r) => <span className="font-medium text-ink">{num(r.grossPay)}</span>,
              align: "right",
              numeric: true,
            },
            { key: "tenure", header: "평균 근속", cell: (r) => `${r.avgTenure.toFixed(1)}개월`, align: "right", numeric: true },
            {
              key: "ot",
              header: "1인 평균 연장근로",
              cell: (r) => (
                <Badge tone={overtimeTone(r.avgOvertime)}>{r.avgOvertime.toFixed(1)}시간</Badge>
              ),
            },
          ]}
          rows={deptRows}
          rowKey={(r) => r.dept}
          maxHeight="26rem"
        />
      </Card>

      <SectionTitle
        hint={`연장근로 25시간 이상 ${attendance.filter((a) => a.overtimeHours >= 25).length}명 · 지각 3회 이상 ${lateAlert.length}명 · 결근 ${absent.length}명`}
      >
        근태 현황
      </SectionTitle>
      <Card>
        <CardHeader
          title="개인별 근태"
          subtitle="연장근로시간 내림차순 — 상단이 과로 위험군"
          right={`${attendance.length}명`}
        />
        <DataTable columns={attColumns} rows={heavyOvertime} rowKey={(r) => r.empNo} maxHeight="30rem" />
      </Card>

      <SectionTitle hint={`실지급 합계 ${won(netTotal)}`}>급여대장</SectionTitle>
      <Card>
        <CardHeader
          title="7월 급여 상세"
          subtitle="09_인사_급여대장 (4대보험·소득세는 실습용 근사치)"
          right={`${payroll.length}명`}
        />
        <DataTable
          columns={payColumns}
          rows={[...payroll].sort((a, b) => b.grossPay - a.grossPay)}
          rowKey={(r) => r.empNo}
          maxHeight="32rem"
        />
      </Card>
    </>
  );
}
