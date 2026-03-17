"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { FileText, Pencil, Flag, ChevronLeft, ChevronRight, Search } from "lucide-react";
import UserNav from "@/components/UserNav";
import type { ReportListItem, ReportListResponse } from "@/types/reports";

const PAGE_SIZE = 20;

export default function ReportsPage() {
  const [items, setItems] = useState<ReportListItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/reports?page=${p}&page_size=${PAGE_SIZE}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to load reports");
      }
      const data: ReportListResponse = await res.json();
      setItems(data.items);
      setPage(data.page);
      setTotal(data.total);
      setHasNext(data.has_next);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports(page);
  }, [fetchReports, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-3">
              <span className="text-[15px] font-bold tracking-tight text-stone-900">
                Toronto Zoning
              </span>
              <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-stone-500">
                Beta
              </span>
            </Link>
            <span className="text-stone-300">/</span>
            <span className="text-[13px] font-medium text-stone-600">My Reports</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="hidden text-[12px] text-stone-400 hover:text-stone-600 transition-colors lg:block"
            >
              ← Back to Search
            </Link>
            <UserNav />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Title + count */}
        <div className="mb-6 flex items-baseline justify-between">
          <div>
            <h1 className="text-[22px] font-bold tracking-tight text-stone-900">
              My Reports
            </h1>
            {!loading && (
              <p className="mt-1 text-[13px] text-stone-400">
                {total} {total === 1 ? "report" : "reports"} saved
              </p>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center justify-between">
              <p className="text-[13px] text-amber-700">{error}</p>
              <button
                onClick={() => fetchReports(page)}
                className="text-[12px] font-medium text-amber-600 hover:text-amber-800"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-stone-600" />
              <p className="text-[12px] text-stone-400">Loading reports…</p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && items.length === 0 && (
          <div className="rounded-xl border border-dashed border-stone-200 bg-white p-12 text-center">
            <FileText className="mx-auto h-10 w-10 text-stone-300" />
            <h3 className="mt-4 text-[15px] font-semibold text-stone-700">
              No reports yet
            </h3>
            <p className="mt-1 text-[13px] text-stone-400">
              Search an address to create your first report.
            </p>
            <Link
              href="/dashboard"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-stone-800 px-4 py-2 text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-stone-700"
            >
              <Search className="h-3.5 w-3.5" />
              Search an Address
            </Link>
          </div>
        )}

        {/* Report cards */}
        {!loading && items.length > 0 && (
          <div className="space-y-2">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/reports/${item.id}`}
                className="group block rounded-xl border border-stone-200 bg-white p-4 shadow-sm transition-all hover:border-stone-300 hover:shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    {/* Title + zone badge */}
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-[14px] font-semibold text-stone-800 group-hover:text-stone-900">
                        {item.title || item.address}
                      </h3>
                      {item.zone_code && (
                        <span className="shrink-0 rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-bold text-sky-700">
                          {item.zone_code}
                        </span>
                      )}
                    </div>

                    {/* Address (if title differs) */}
                    {item.title && item.title !== item.address && (
                      <p className="mt-0.5 truncate text-[12px] text-stone-400">
                        {item.address}
                      </p>
                    )}

                    {/* Meta row */}
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-stone-400">
                      <span>
                        Created{" "}
                        {new Date(item.created_at).toLocaleDateString("en-CA", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      {item.updated_at !== item.created_at && (
                        <span>
                          Updated{" "}
                          {new Date(item.updated_at).toLocaleDateString("en-CA", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex shrink-0 items-center gap-2">
                    {item.edit_count > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-600">
                        <Pencil className="h-3 w-3" />
                        {item.edit_count}
                      </span>
                    )}
                    {item.flag_count > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-600">
                        <Flag className="h-3 w-3" />
                        {item.flag_count}
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 text-stone-300 transition-colors group-hover:text-stone-500" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && total > PAGE_SIZE && (
          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-[12px] font-medium text-stone-600 shadow-sm transition-colors hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous
            </button>
            <span className="text-[12px] text-stone-400">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasNext}
              className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-[12px] font-medium text-stone-600 shadow-sm transition-colors hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
