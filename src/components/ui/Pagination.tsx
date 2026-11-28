"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";

// Paging for lists. The API's list shape is { items, total, page, pages } with ?page= from 1
// (backend docs/api/README.md), so both variants work from page numbers.
//
// Numbered, for tables where people jump around:
//   const [page, setPage] = useState(1);
//   const list = useQuery({ queryKey: [..., page], queryFn: () => api.list({ page }) });
//   <Pagination page={list.data.page} pages={list.data.pages} onPageChange={setPage} />
//
// Load more, for feeds read top to bottom (pairs with useInfiniteQuery):
//   <LoadMore hasMore={q.hasNextPage} loading={q.isFetchingNextPage} onLoadMore={() => q.fetchNextPage()} />
//
// Both render nothing when there is nothing more to page through.

/** Page numbers to show: always the first and last, the current page and its neighbours, "…" for gaps. */
export function pageItems(page: number, pages: number, siblings = 1): (number | "…")[] {
  const out: (number | "…")[] = [];
  for (let p = 1; p <= pages; p++) {
    if (p === 1 || p === pages || Math.abs(p - page) <= siblings) out.push(p);
    else if (out[out.length - 1] !== "…") out.push("…");
  }
  // A gap hiding just one page shows that page instead.
  return out.map((v, i) => (v === "…" && out[i - 1] !== undefined && (out[i + 1] as number) - (out[i - 1] as number) === 2 ? (out[i - 1] as number) + 1 : v));
}

type PaginationProps = {
  page: number;
  pages: number;
  onPageChange: (page: number) => void;
  /** Disables the controls while the next page loads. */
  disabled?: boolean;
  className?: string;
};

export default function Pagination({ page, pages, onPageChange, disabled = false, className = "" }: PaginationProps) {
  if (pages <= 1) return null;
  const go = (p: number) => !disabled && p >= 1 && p <= pages && p !== page && onPageChange(p);
  const step = "inline-flex items-center gap-1 rounded-md px-2 py-1.5 font-medium hover:underline disabled:opacity-40 disabled:no-underline";

  return (
    <nav aria-label="Pagination" className={`flex items-center justify-between gap-3 text-sm ${className}`}>
      <button type="button" className={step} onClick={() => go(page - 1)} disabled={disabled || page <= 1}>
        <HugeiconsIcon icon={ArrowLeft01Icon} size={16} strokeWidth={2.2} aria-hidden="true" />
        Previous
      </button>

      <ol className="flex flex-wrap items-center justify-center gap-1">
        {pageItems(page, pages).map((p, i) =>
          p === "…" ? (
            <li key={`gap-${i}`} aria-hidden="true" className="px-1 text-muted">
              …
            </li>
          ) : (
            <li key={p}>
              <button
                type="button"
                onClick={() => go(p)}
                disabled={disabled}
                aria-label={`Page ${p}`}
                aria-current={p === page ? "page" : undefined}
                className={`h-8 min-w-8 rounded-md border px-2 tabular-nums transition-colors ${
                  p === page ? "border-ink bg-ink text-cream" : "border-transparent hover:border-ink"
                }`}
              >
                {p}
              </button>
            </li>
          ),
        )}
      </ol>

      <button type="button" className={step} onClick={() => go(page + 1)} disabled={disabled || page >= pages}>
        Next
        <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={2.2} aria-hidden="true" />
      </button>
    </nav>
  );
}

type LoadMoreProps = {
  hasMore: boolean | undefined;
  loading?: boolean;
  onLoadMore: () => void;
  label?: string;
  loadingLabel?: string;
};

export function LoadMore({ hasMore, loading = false, onLoadMore, label = "Show more", loadingLabel = "Loading…" }: LoadMoreProps) {
  if (!hasMore) return null;
  return (
    <div className="mt-6 flex justify-center">
      <button type="button" className="btn-secondary disabled:opacity-60" onClick={onLoadMore} disabled={loading} aria-busy={loading || undefined}>
        {loading ? loadingLabel : label}
      </button>
    </div>
  );
}
