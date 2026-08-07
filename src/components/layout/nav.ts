export type NavItem = {
  href: string;
  label: string;
  description: string;
  /** 인라인 SVG path (24x24 stroke 아이콘) */
  icon: string;
};

export const NAV: NavItem[] = [
  {
    href: "/",
    label: "경영 요약",
    description: "전사 KPI 한눈에",
    icon: "M3 13h4l3 7 4-16 3 9h4",
  },
  {
    href: "/sales",
    label: "매출 분석",
    description: "제품·거래처·담당자별",
    icon: "M4 19V9m5 10V5m5 14v-7m5 7V8",
  },
  {
    href: "/finance",
    label: "재무 / 손익",
    description: "손익계산서·자금흐름",
    icon: "M12 3v18M8 7h6a3 3 0 0 1 0 6H9a3 3 0 0 0 0 6h7",
  },
  {
    href: "/receivables",
    label: "채권 관리",
    description: "미수금 연령분석",
    icon: "M3 7h18v12H3zM3 11h18M7 15h4",
  },
  {
    href: "/pipeline",
    label: "영업 파이프라인",
    description: "딜 단계·활동 로그",
    icon: "M3 5h18l-7 8v6l-4 2v-8z",
  },
  {
    href: "/hr",
    label: "인사 / 급여",
    description: "인력·급여·근태",
    icon: "M16 19v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M9.5 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6M21 19v-2a4 4 0 0 0-3-3.87",
  },
  {
    href: "/projects",
    label: "프로젝트",
    description: "진행률·리스크·태스크",
    icon: "M4 5h16v14H4zM9 5v14M4 10h5",
  },
];
