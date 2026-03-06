"use client";

/**
 * /report/[id] — Public shared report page.
 * Fetches the shared report data and renders a read-only ZoningReport.
 */

import { useState, useEffect, use } from "react";
import Link from "next/link";
import ZoningReport from "@/components/ZoningReport";

export default function SharedReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [report, setReport] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReport() {
      try {
        const res = await fetch(`/api/reports/shared/${id}`);
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("This report was not found or has expired.");
          }
          throw new Error("Failed to load report");
        }
        const data = await res.json();
        setReport(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load report");
      } finally {
        setLoading(false);
      }
    }

    fetchReport();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50">
        <header className="border-b border-stone-200 bg-white/90 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
            <Link href="/" className="text-[15px] font-bold tracking-tight text-stone-900">
              Toronto Zoning
            </Link>
            <span className="rounded-full bg-stone-100 px-3 py-1 text-[11px] font-medium text-stone-500">
              Shared Report
            </span>
          </div>
        </header>
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="flex flex-col items-center justify-center">
            <div className="relative">
              <div className="h-14 w-14 rounded-full border-2 border-stone-200" />
              <div className="absolute inset-0 h-14 w-14 animate-spin rounded-full border-2 border-transparent border-t-stone-900" />
            </div>
            <p className="mt-5 text-[16px] font-semibold text-stone-800">Loading shared report…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-stone-50">
        <header className="border-b border-stone-200 bg-white/90 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
            <Link href="/" className="text-[15px] font-bold tracking-tight text-stone-900">
              Toronto Zoning
            </Link>
          </div>
        </header>
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="flex flex-col items-center justify-center text-center">
            <span className="text-[48px]">📋</span>
            <h1 className="mt-4 text-[24px] font-bold text-stone-900">Report Not Found</h1>
            <p className="mt-2 text-[14px] text-stone-500">{error || "This report doesn't exist or has expired."}</p>
            <Link
              href="/"
              className="mt-6 rounded-xl bg-stone-900 px-6 py-3 text-[14px] font-semibold text-white hover:bg-stone-800"
            >
              Go to Toronto Zoning
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Reconstruct the data object that ZoningReport expects from the cached lookup
  const lookupData = report.lookup_data || {};

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center gap-3">
            <span className="text-[15px] font-bold tracking-tight text-stone-900">
              Toronto Zoning
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-medium text-blue-600">
              Shared Report
            </span>
            <span className="text-[11px] text-stone-400">
              {report.view_count} view{report.view_count !== 1 ? "s" : ""}
            </span>
            <Link
              href="/sign-up"
              className="rounded-lg bg-stone-900 px-4 py-1.5 text-[12px] font-semibold text-white hover:bg-stone-800"
            >
              Create your own
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-6">
        <ZoningReport data={lookupData} />
      </main>
    </div>
  );
}
