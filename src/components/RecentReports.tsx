"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

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
    fetch("/api/reports?page=1&page_size=5")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!cancelled && json?.items) {
          setReports(json.items);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!loaded || reports.length === 0) return null;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-xs tracking-widest uppercase text-stone-500 font-bold">
          Recent Lookups
        </span>
        <Link
          href="/reports"
          className="text-xs font-semibold text-emerald-700 hover:underline"
        >
          View All History
        </Link>
      </div>

      <div className="space-y-3">
        {reports.map((r) => (
          <Link
            key={r.id}
            href={`/reports/${r.id}`}
            className="flex items-center bg-white border border-stone-200 rounded-xl px-4 py-4 hover:bg-stone-50 transition-colors cursor-pointer shadow-sm"
          >
            <div className="flex-1 font-heading font-semibold text-stone-900 truncate">
              {r.title || r.address}
            </div>

            {r.zone_code && (
              <div className="w-24 text-center shrink-0">
                <span className="bg-stone-900 text-white text-[10px] px-2 py-0.5 rounded font-bold">
                  {r.zone_code}
                </span>
              </div>
            )}

            <div className="w-24 text-right shrink-0 text-stone-400 text-xs font-medium">
              {new Date(r.updated_at).toLocaleDateString("en-CA", {
                month: "short",
                day: "numeric",
              })}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
