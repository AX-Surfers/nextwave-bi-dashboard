-- ---------------------------------------------------------------------------
-- 넥스트웨이브 경영 BI — Supabase 스키마
--
-- 지금 대시보드는 src/data/*.json 정적 파일을 읽는다. Supabase로 옮길 때:
--   1) Supabase 프로젝트 생성 후 SQL Editor에서 이 파일 실행
--   2) `npm run seed:sql` 로 만든 seed.sql 실행 (또는 CSV 임포트)
--   3) src/lib/repository.ts 의 함수 본문만 supabase 쿼리로 교체
--
-- 컬럼명은 src/lib/types.ts 의 필드명과 1:1로 맞춰 두었다(snake_case 변환 없이
-- 그대로 select 할 수 있도록 따옴표 식별자 사용).
-- ---------------------------------------------------------------------------

create table if not exists company (
  id            int primary key default 1,
  name          text not null,
  "nameEn"      text not null,
  industry      text not null,
  hq            text not null,
  "foundedAt"   date not null,
  "periodStart" date not null,
  "periodEnd"   date not null,
  "baseDate"    date not null,
  currency      text not null default 'KRW',
  "vatRate"     numeric not null default 0.1
);

create table if not exists sales (
  "voucherNo"     text primary key,
  date            date not null,
  "customerCode"  text not null,
  customer        text not null,
  industry        text not null,
  region          text not null,
  "productCode"   text not null,
  product         text not null,
  category        text not null,
  qty             int not null,
  "unitPrice"     bigint not null,
  "supplyAmount"  bigint not null,
  vat             bigint not null,
  total           bigint not null,
  rep             text not null,
  team            text not null,
  "paymentTerm"   text not null,
  channel         text not null
);
create index if not exists sales_date_idx on sales (date);
create index if not exists sales_category_idx on sales (category);

create table if not exists vouchers (
  "voucherNo"   text primary key,
  date          date not null,
  "accountCode" int not null,
  account       text not null,
  "accountType" text not null,
  dept          text not null,
  vendor        text not null,
  memo          text,
  amount        bigint not null,
  evidence      text,
  approval      text not null
);
create index if not exists vouchers_account_idx on vouchers ("accountCode");

create table if not exists cashflow (
  id             bigserial primary key,
  date           date not null,
  type           text not null,
  account        text not null,
  counterparty   text,
  memo           text,
  inflow         bigint not null default 0,
  outflow        bigint not null default 0,
  balance        bigint not null,
  bank           text not null
);

create table if not exists receivables (
  "invoiceNo"     text primary key,
  "customerCode"  text not null,
  customer        text not null,
  industry        text not null,
  "issueDate"     date not null,
  "paymentTerm"   text not null,
  "dueDate"       date not null,
  billed          bigint not null,
  paid            bigint not null,
  outstanding     bigint not null,
  "overdueDays"   int not null,
  "ageBucket"     text not null,
  owner           text not null,
  status          text not null
);

create table if not exists pipeline (
  "dealId"           text primary key,
  customer           text not null,
  industry           text not null,
  region             text not null,
  rep                text not null,
  team               text not null,
  "productGroup"     text not null,
  stage              text not null,
  probability        numeric not null,
  amount             bigint not null,
  "weightedAmount"   bigint not null,
  "createdAt"        date not null,
  "lastActivityAt"   date not null,
  "expectedCloseAt"  date not null,
  "idleDays"         int not null,
  channel            text not null,
  competitor         text,
  note               text
);

create table if not exists activities (
  "activityId"     text primary key,
  date             date not null,
  rep              text not null,
  team             text not null,
  customer         text not null,
  "dealId"         text,
  type             text not null,
  "durationMin"    int not null,
  result           text not null,
  "nextAction"     text,
  "nextActionDate" date
);

create table if not exists employees (
  "empNo"          text primary key,
  name             text not null,
  dept             text not null,
  rank             text not null,
  "hiredAt"        date not null,
  "tenureMonths"   int not null,
  "employmentType" text not null,
  "annualSalary"   bigint not null,
  email            text,
  status           text not null,
  "resignedAt"     date,
  workplace        text not null
);

create table if not exists payroll (
  "empNo"              text primary key references employees("empNo"),
  name                 text not null,
  dept                 text not null,
  "baseSalary"         bigint not null,
  "mealAllowance"      bigint not null,
  "positionAllowance"  bigint not null,
  "overtimePay"        bigint not null,
  "grossPay"           bigint not null,
  pension              bigint not null,
  health               bigint not null,
  "longTermCare"       bigint not null,
  "employmentIns"      bigint not null,
  "taxRate"            numeric not null,
  "incomeTax"          bigint not null,
  "localTax"           bigint not null,
  "totalDeduction"     bigint not null,
  "netPay"             bigint not null
);

create table if not exists attendance (
  "empNo"            text primary key references employees("empNo"),
  name               text not null,
  dept               text not null,
  "overtimeHours"    numeric not null,
  "scheduledDays"    numeric not null,
  "actualDays"       numeric not null,
  "nightHours"       numeric not null,
  "annualLeaveUsed"  numeric not null,
  "annualLeaveLeft"  numeric not null,
  "lateCount"        int not null,
  "absenceDays"      numeric not null,
  "remoteDays"       numeric not null,
  "totalWorkHours"   numeric not null
);

create table if not exists projects (
  code             text primary key,
  name             text not null,
  customer         text not null,
  pm               text not null,
  dept             text not null,
  type             text not null,
  "startAt"        date not null,
  "endAt"          date not null,
  progress         numeric not null,
  status           text not null,
  "contractAmount" bigint not null,
  budget           bigint not null,
  spent            bigint not null,
  "budgetUsage"    numeric not null,
  "budgetLeft"     bigint not null,
  "daysLeft"       int not null,
  risk             text not null,
  issue            text
);

create table if not exists tasks (
  "taskId"          text primary key,
  "projectCode"     text references projects(code),
  name              text not null,
  owner             text not null,
  dept              text not null,
  priority          text not null,
  status            text not null,
  "startAt"         date not null,
  "dueAt"           date not null,
  "doneAt"          date,
  progress          numeric not null,
  "estimatedHours"  numeric not null,
  "actualHours"     numeric not null,
  "delayDays"       int not null
);

-- 손익계산서는 원장에서 파생되는 값이므로 뷰로 두는 편이 자연스럽다.
-- (전월 실적·이자수익·법인세율 등 가정값은 별도 테이블로 관리)
create table if not exists pl_assumptions (
  label     text primary key,
  previous  bigint not null
);

-- ---------------------------------------------------------------------------
-- RLS: 로그인 없이 읽기만 하는 대시보드이므로 anon 읽기 허용.
-- 인증을 붙이면 아래 정책을 auth.role() = 'authenticated' 로 바꾼다.
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'company','sales','vouchers','cashflow','receivables','pipeline',
    'activities','employees','payroll','attendance','projects','tasks',
    'pl_assumptions'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy if not exists "public read %1$s" on %1$I for select using (true)', t
    );
  end loop;
end $$;
