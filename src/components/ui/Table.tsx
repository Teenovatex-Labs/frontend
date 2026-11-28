"use client";

import { useMemo, useState, type ReactNode } from "react";
import EmptyState from "./EmptyState";
import Skeleton from "./Skeleton";

// A dense data table in the flat brand style: 1px ink border, yellow header, line dividers.
// Handles its own loading, error and empty states so screens don't repeat them.
//
// Usage:
//   <Table
//     label="Members"
//     rows={users.data?.items}
//     rowKey={(u) => u.id}
//     loading={users.isPending}
//     error={users.isError}
//     empty="No members match."
//     columns={[
//       { key: "name", header: "Member", cell: (u) => `@${u.username}` },
//       { key: "joined", header: "Joined", cell: (u) => timeAgo(u.created_at), sortValue: (u) => u.created_at },
//       { key: "actions", header: <span className="sr-only">Actions</span>, cell: (u) => <button>…</button>, align: "right" },
//     ]}
//   />
//
// Sorting is optional and client-side: give a column `sortValue` and its header becomes a
// button cycling ascending, descending, then back to the order the rows came in.

export type Column<T> = {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  /** Extra classes for this column's cells (e.g. "text-muted", "tabular-nums"). */
  className?: string | ((row: T) => string);
  align?: "left" | "right";
  sortValue?: (row: T) => string | number;
};

type Props<T> = {
  columns: Column<T>[];
  rows: T[] | undefined;
  rowKey: (row: T) => string;
  /** Accessible name for the table, e.g. "Members". */
  label: string;
  loading?: boolean;
  /** True for the default message, or your own text. */
  error?: boolean | ReactNode;
  /** Title shown when there are no rows. */
  empty?: ReactNode;
  /** Narrower screens scroll sideways instead of squashing columns. */
  minWidth?: number;
};

type Sort = { key: string; dir: "asc" | "desc" } | null;

export default function Table<T>({ columns, rows, rowKey, label, loading, error, empty = "Nothing here yet.", minWidth = 600 }: Props<T>) {
  const [sort, setSort] = useState<Sort>(null);

  const sorted = useMemo(() => {
    if (!rows || !sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return rows;
    const value = col.sortValue;
    const factor = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const x = value(a);
      const y = value(b);
      return (typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y))) * factor;
    });
  }, [rows, columns, sort]);

  if (loading) return <Skeleton className="h-64 w-full" />;
  if (error) return <EmptyState title={error === true ? "That didn't load." : error} />;
  if (!sorted || sorted.length === 0) return <EmptyState title={empty} />;

  const cycle = (key: string) =>
    setSort((s) => (s?.key !== key ? { key, dir: "asc" } : s.dir === "asc" ? { key, dir: "desc" } : null));
  const alignClass = (c: Column<T>) => (c.align === "right" ? "text-right" : "");

  return (
    <div className="overflow-x-auto border border-ink bg-white">
      <table aria-label={label} className="w-full text-left text-sm" style={{ minWidth }}>
        <thead className="border-b border-ink bg-yellow text-xs uppercase tracking-wide">
          <tr>
            {columns.map((c) => {
              const active = sort?.key === c.key ? sort.dir : null;
              return (
                <th
                  key={c.key}
                  scope="col"
                  className={`px-4 py-3 ${alignClass(c)}`}
                  aria-sort={active === "asc" ? "ascending" : active === "desc" ? "descending" : c.sortValue ? "none" : undefined}
                >
                  {c.sortValue ? (
                    <button type="button" onClick={() => cycle(c.key)} className="inline-flex items-center gap-1 uppercase tracking-wide hover:underline">
                      {c.header}
                      <span aria-hidden="true" className={active ? "" : "opacity-30"}>
                        {active === "desc" ? "↓" : "↑"}
                      </span>
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {sorted.map((row) => (
            <tr key={rowKey(row)} className="transition-colors hover:bg-cream">
              {columns.map((c) => (
                <td key={c.key} className={`px-4 py-3 ${alignClass(c)} ${typeof c.className === "function" ? c.className(row) : c.className ?? ""}`}>
                  {c.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
