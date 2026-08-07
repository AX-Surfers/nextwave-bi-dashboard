/**
 * 도메인 타입 — 엑셀 원장(서퍼스_경영데이터_2026-07.xlsx) 스키마와 1:1 대응.
 * supabase/schema.sql 의 테이블 정의와 컬럼명이 동일하므로,
 * Supabase 전환 시 이 타입을 그대로 재사용할 수 있다.
 */

export type Company = {
  name: string;
  nameEn: string;
  industry: string;
  hq: string;
  foundedAt: string;
  periodStart: string;
  periodEnd: string;
  baseDate: string;
  currency: string;
  vatRate: number;
};

export type SalesRow = {
  date: string;
  voucherNo: string;
  customerCode: string;
  customer: string;
  industry: string;
  region: string;
  productCode: string;
  product: string;
  category: "SaaS구독" | "하드웨어" | "용역" | "유지보수";
  qty: number;
  unitPrice: number;
  supplyAmount: number;
  vat: number;
  total: number;
  rep: string;
  team: string;
  paymentTerm: string;
  channel: string;
};

export type VoucherRow = {
  date: string;
  voucherNo: string;
  accountCode: number;
  account: string;
  accountType: "매출원가" | "판매비와관리비" | "영업외비용" | string;
  dept: string;
  vendor: string;
  memo: string;
  amount: number;
  evidence: string;
  approval: "승인" | "결재중" | "반려" | string;
};

export type PlLine = {
  code?: number;
  label: string;
  current: number;
  previous: number;
};

export type PlTotal = { current: number; previous: number };

export type IncomeStatement = {
  revenueLines: PlLine[];
  cogsLines: PlLine[];
  sgaLines: PlLine[];
  totals: {
    revenue: PlTotal;
    cogs: PlTotal;
    grossProfit: PlTotal;
    sga: PlTotal;
    operatingProfit: PlTotal;
    interestIncome: PlTotal;
    interestCost: PlTotal;
    pretaxProfit: PlTotal;
    tax: PlTotal;
    netProfit: PlTotal;
  };
  taxRate: number;
};

export type CashflowRow = {
  date: string;
  type: "기초" | "입금" | "출금" | string;
  account: string;
  counterparty: string | null;
  memo: string;
  inflow: number;
  outflow: number;
  balance: number;
  bank: string;
};

export type AgeBucket = "회수완료" | "정상" | "30일이하" | "31~60일" | "61~90일" | "90일초과";

export type ReceivableRow = {
  invoiceNo: string;
  customerCode: string;
  customer: string;
  industry: string;
  issueDate: string;
  paymentTerm: string;
  dueDate: string;
  billed: number;
  paid: number;
  outstanding: number;
  overdueDays: number;
  ageBucket: AgeBucket;
  owner: string;
  status: "완료" | "미회수" | "부분회수" | string;
};

export type DealStage = "컨택" | "미팅/데모" | "제안" | "견적/협상" | "수주" | "실주";

export type PipelineRow = {
  dealId: string;
  customer: string;
  industry: string;
  region: string;
  rep: string;
  team: string;
  productGroup: string;
  stage: DealStage;
  probability: number;
  amount: number;
  weightedAmount: number;
  createdAt: string;
  lastActivityAt: string;
  expectedCloseAt: string;
  idleDays: number;
  channel: string;
  competitor: string;
  note: string;
};

export type ActivityRow = {
  activityId: string;
  date: string;
  rep: string;
  team: string;
  customer: string;
  dealId: string;
  type: string;
  durationMin: number;
  result: "긍정" | "진전" | "보통" | "부정" | string;
  nextAction: string;
  nextActionDate: string | null;
};

export type EmployeeRow = {
  empNo: string;
  name: string;
  dept: string;
  rank: string;
  hiredAt: string;
  tenureMonths: number;
  employmentType: string;
  annualSalary: number;
  email: string;
  status: "재직" | "퇴사" | string;
  resignedAt: string | null;
  workplace: string;
};

export type PayrollRow = {
  empNo: string;
  name: string;
  dept: string;
  baseSalary: number;
  mealAllowance: number;
  positionAllowance: number;
  overtimePay: number;
  grossPay: number;
  pension: number;
  health: number;
  longTermCare: number;
  employmentIns: number;
  taxRate: number;
  incomeTax: number;
  localTax: number;
  totalDeduction: number;
  netPay: number;
};

export type AttendanceRow = {
  empNo: string;
  name: string;
  dept: string;
  overtimeHours: number;
  scheduledDays: number;
  actualDays: number;
  nightHours: number;
  annualLeaveUsed: number;
  annualLeaveLeft: number;
  lateCount: number;
  absenceDays: number;
  remoteDays: number;
  totalWorkHours: number;
};

export type ProjectRow = {
  code: string;
  name: string;
  customer: string;
  pm: string;
  dept: string;
  type: string;
  startAt: string;
  endAt: string;
  progress: number;
  status: string;
  contractAmount: number;
  budget: number;
  spent: number;
  budgetUsage: number;
  budgetLeft: number;
  daysLeft: number;
  risk: "높음" | "보통" | "낮음" | string;
  issue: string;
};

export type TaskRow = {
  taskId: string;
  projectCode: string;
  name: string;
  owner: string;
  dept: string;
  priority: "높음" | "보통" | "낮음" | string;
  status: "완료" | "진행중" | "대기" | "보류" | string;
  startAt: string;
  dueAt: string;
  doneAt: string | null;
  progress: number;
  estimatedHours: number;
  actualHours: number;
  delayDays: number;
};
