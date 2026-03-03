"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/* ── Types ─────────────────────────────────────────────────────────────── */

interface ArticleSummary {
  id: number;
  article_type: string;
  slug: string;
  title: string;
  subtitle: string | null;
  summary: string | null;
  tags: string[];
  published_at: string | null;
  period_start: string | null;
  period_end: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  weekly_brief: "Weekly Brief",
  coa_intelligence: "CoA Intelligence",
  explainer: "Policy Explainer",
  impact_brief: "Impact Brief",
  sp_mtsa_deep_dive: "SP / MTSA Deep Dive",
};

const TYPE_COLORS: Record<string, string> = {
  weekly_brief: "bg-blue-50 text-blue-700 border-blue-200",
  coa_intelligence: "bg-amber-50 text-amber-700 border-amber-200",
  explainer: "bg-violet-50 text-violet-700 border-violet-200",
  impact_brief: "bg-green-50 text-green-700 border-green-200",
  sp_mtsa_deep_dive: "bg-rose-50 text-rose-700 border-rose-200",
};

/* ── Main Page ─────────────────────────────────────────────────────────── */

export default function IntelligencePage() {
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const url =
          filter === "all"
            ? "/api/intel/articles"
            : `/api/intel/articles?article_type=${filter}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setArticles(data.articles ?? []);
      } catch {
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };
    setLoading(true);
    fetchArticles();
  }, [filter]);

  const featured = articles[0];
  const rest = articles.slice(1);

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <Link href="/" className="text-[12px] text-stone-400 hover:text-stone-600">
            ← Toronto Zoning
          </Link>
          <h1 className="mt-3 text-[28px] font-bold tracking-tight text-stone-900">
            Planning Intelligence
          </h1>
          <p className="mt-1 text-[14px] text-stone-500 max-w-xl">
            AI-curated analysis of Toronto&apos;s development pipeline, zoning decisions,
            and planning policy — distilled for developers, architects, and capital teams.
          </p>
        </div>
      </header>

      {/* Filters */}
      <div className="border-b border-stone-100 bg-white">
        <div className="mx-auto flex max-w-5xl gap-2 overflow-x-auto px-6 py-3">
          {[
            { key: "all", label: "All" },
            { key: "weekly_brief", label: "Weekly Brief" },
            { key: "coa_intelligence", label: "CoA" },
            { key: "explainer", label: "Explainers" },
            { key: "impact_brief", label: "Impact" },
            { key: "sp_mtsa_deep_dive", label: "SP / MTSA" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`whitespace-nowrap rounded-full px-3 py-1 text-[12px] font-medium transition-colors ${
                filter === f.key
                  ? "bg-stone-800 text-white"
                  : "bg-stone-100 text-stone-500 hover:bg-stone-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {loading ? (
          <p className="text-[13px] text-stone-400 text-center py-20">Loading…</p>
        ) : articles.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[14px] text-stone-500">No published articles yet.</p>
            <p className="text-[12px] text-stone-400 mt-1">
              Check back soon — intelligence briefs are generated weekly.
            </p>
          </div>
        ) : (
          <>
            {/* Featured */}
            {featured && (
              <Link
                href={`/intelligence/${featured.slug}`}
                className="block rounded-xl border border-stone-200 bg-white p-6 mb-8 hover:border-stone-300 transition-colors"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                      TYPE_COLORS[featured.article_type] || "bg-stone-50 text-stone-600"
                    }`}
                  >
                    {TYPE_LABELS[featured.article_type] || featured.article_type}
                  </span>
                  {featured.published_at && (
                    <span className="text-[11px] text-stone-400">
                      {new Date(featured.published_at).toLocaleDateString("en-CA", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  )}
                </div>
                <h2 className="text-[20px] font-bold text-stone-900 leading-snug">
                  {featured.title}
                </h2>
                {featured.subtitle && (
                  <p className="mt-1 text-[14px] text-stone-600">{featured.subtitle}</p>
                )}
                {featured.summary && (
                  <p className="mt-3 text-[13px] text-stone-500 leading-relaxed line-clamp-3">
                    {featured.summary}
                  </p>
                )}
                <span className="mt-4 inline-block text-[12px] font-medium text-stone-600">
                  Read full brief →
                </span>
              </Link>
            )}

            {/* Grid */}
            {rest.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((a) => (
                  <Link
                    key={a.id}
                    href={`/intelligence/${a.slug}`}
                    className="flex flex-col rounded-lg border border-stone-200 bg-white p-4 hover:border-stone-300 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                          TYPE_COLORS[a.article_type] || "bg-stone-50 text-stone-600"
                        }`}
                      >
                        {TYPE_LABELS[a.article_type] || a.article_type}
                      </span>
                      {a.published_at && (
                        <span className="text-[10px] text-stone-400">
                          {new Date(a.published_at).toLocaleDateString("en-CA", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                    <h3 className="text-[14px] font-semibold text-stone-800 leading-snug line-clamp-2">
                      {a.title}
                    </h3>
                    {a.summary && (
                      <p className="mt-1.5 text-[12px] text-stone-500 leading-relaxed line-clamp-2 flex-1">
                        {a.summary}
                      </p>
                    )}
                    <span className="mt-3 text-[11px] font-medium text-stone-500">
                      Read →
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-100 bg-white py-6">
        <div className="mx-auto max-w-5xl px-6 text-center text-[11px] text-stone-400">
          Intelligence content is AI-generated from Toronto Open Data and reviewed
          by editorial staff before publication.
        </div>
      </footer>
    </div>
  );
}
