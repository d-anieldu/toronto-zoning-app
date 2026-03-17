"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FileText, ChevronRight } from "lucide-react";

interface ReportPreview {
  id: string;
  title: string | null;
  address: string;
  zone_code: string | null;
  updated_at: string;
}

export default function RecentReports() {
  const [reports, setReports] = useState<ReportPreview[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/reports?page=1&page_size=3")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!cancelled && json?.items) {
          setReports(json.items);
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, []);

  // Don't render anything until loaded, and hide if no reports
  if (!loaded || reports.length === 0) return null;

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold tracking-tight text-stone-900">
          Recent Reports
        </h2>
        <Link
          href="/reports"
          className="text-[12px] font-medium text-stone-500 hover:text-stone-700 transition-colors"
        >
          View all →
        </Link>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {reports.map((r) => (
          <Link
            key={r.id}
            href={`/reports/${r.id}`}
            className="group flex items-start justify-between rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm hover:border-stone-300 hover:shadow transition-all"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                <p className="truncate text-[12px] font-semibold text-stone-700">
                  {r.title || r.address}
                </p>
              </div>
              {r.title && r.title !== r.address && (
                <p className="mt-0.5 truncate pl-[22px] text-[11px] text-stone-400">
                  {r.address}
                </p>
              )}
              <div className="mt-1.5 flex items-center gap-2 pl-[22px]">
                {r.zone_code && (
                  <span className="rounded bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold text-sky-700">
                    {r.zone_code}
                  </span>
                )}
                <span className="text-[10px] text-stone-400">
                  {new Date(r.updated_at).toLocaleDateString("en-CA")}
                </span>
              </div>
            </div>
            <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-stone-300 group-hover:text-stone-500 transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}
