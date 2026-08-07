/**
 * 데이터 접근 계층 (Repository).
 *
 * 지금은 `src/data/*.json` 정적 파일을 읽는다. Supabase로 옮길 때는
 * 이 파일의 함수 본문만 교체하면 되고, 화면/집계 코드는 손대지 않는다.
 *
 *   // 예시 — Supabase 전환 시
 *   import { createClient } from "@/lib/supabase/server";
 *   export async function getSales(): Promise<SalesRow[]> {
 *     const supabase = await createClient();
 *     const { data, error } = await supabase.from("sales").select("*").order("date");
 *     if (error) throw error;
 *     return data as SalesRow[];
 *   }
 *
 * 테이블 DDL은 `supabase/schema.sql`, 시드는 `supabase/seed.sql` 참고.
 * 모든 함수를 async로 둔 이유도 전환 시 시그니처를 바꾸지 않기 위함이다.
 */
import companyJson from "@/data/company.json";
import salesJson from "@/data/sales.json";
import vouchersJson from "@/data/vouchers.json";
import incomeStatementJson from "@/data/income-statement.json";
import cashflowJson from "@/data/cashflow.json";
import receivablesJson from "@/data/receivables.json";
import pipelineJson from "@/data/pipeline.json";
import activitiesJson from "@/data/activities.json";
import employeesJson from "@/data/employees.json";
import payrollJson from "@/data/payroll.json";
import attendanceJson from "@/data/attendance.json";
import projectsJson from "@/data/projects.json";
import tasksJson from "@/data/tasks.json";

import type {
  ActivityRow,
  AttendanceRow,
  CashflowRow,
  Company,
  EmployeeRow,
  IncomeStatement,
  PayrollRow,
  PipelineRow,
  ProjectRow,
  ReceivableRow,
  SalesRow,
  TaskRow,
  VoucherRow,
} from "./types";

export async function getCompany(): Promise<Company> {
  return companyJson as Company;
}

export async function getSales(): Promise<SalesRow[]> {
  return salesJson as SalesRow[];
}

export async function getVouchers(): Promise<VoucherRow[]> {
  return vouchersJson as VoucherRow[];
}

export async function getIncomeStatement(): Promise<IncomeStatement> {
  return incomeStatementJson as IncomeStatement;
}

export async function getCashflow(): Promise<CashflowRow[]> {
  return cashflowJson as CashflowRow[];
}

export async function getReceivables(): Promise<ReceivableRow[]> {
  return receivablesJson as ReceivableRow[];
}

export async function getPipeline(): Promise<PipelineRow[]> {
  return pipelineJson as PipelineRow[];
}

export async function getActivities(): Promise<ActivityRow[]> {
  return activitiesJson as ActivityRow[];
}

export async function getEmployees(): Promise<EmployeeRow[]> {
  return employeesJson as EmployeeRow[];
}

export async function getPayroll(): Promise<PayrollRow[]> {
  return payrollJson as PayrollRow[];
}

export async function getAttendance(): Promise<AttendanceRow[]> {
  return attendanceJson as AttendanceRow[];
}

export async function getProjects(): Promise<ProjectRow[]> {
  return projectsJson as ProjectRow[];
}

export async function getTasks(): Promise<TaskRow[]> {
  return tasksJson as TaskRow[];
}
