import type { ReactNode } from "react";

export type Column<T> = {
  key: string;
  header: string;
  /** 셀 렌더러 */
  cell: (row: T, index: number) => ReactNode;
  align?: "left" | "right" | "center";
  /** 숫자 열 — tabular-nums 적용 */
  numeric?: boolean;
  width?: string;
  headerHint?: string;
};

/**
 * 표 뷰. 차트가 색 대비 완화(relief)를 필요로 할 때 값을 확인할 수 있는 경로이자,
 * 드릴다운의 최종 목적지.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  maxHeight = "26rem",
  empty = "표시할 데이터가 없습니다.",
  zebra = true,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  maxHeight?: string;
  empty?: string;
  zebra?: boolean;
}) {
  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm text-ink-muted">{empty}</p>;
  }

  return (
    <div className="thin-scroll overflow-auto rounded-lg border border-line" style={{ maxHeight }}>
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 z-10">
          <tr className="bg-surface-2">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                style={{ width: col.width }}
                className={`border-b border-line px-3 py-2.5 text-xs font-semibold whitespace-nowrap text-ink-secondary ${
                  col.align === "right"
                    ? "text-right"
                    : col.align === "center"
                      ? "text-center"
                      : "text-left"
                }`}
                title={col.headerHint}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={rowKey(row, i)}
              className={`border-b border-line/60 last:border-0 hover:bg-surface-2 ${
                zebra && i % 2 === 1 ? "bg-surface-2/40" : ""
              }`}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-3 py-2 align-middle text-ink-secondary ${
                    col.align === "right"
                      ? "text-right"
                      : col.align === "center"
                        ? "text-center"
                        : "text-left"
                  } ${col.numeric ? "tabular-nums" : ""}`}
                >
                  {col.cell(row, i)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
