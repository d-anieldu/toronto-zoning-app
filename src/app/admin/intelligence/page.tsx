"use client";

import { useEffect, useState, useCallback } from "react";
// TODO: Re-add UserButton when auth is re-enabled
import Link from "next/link";

/* ── Types ─────────────────────────────────────────────────────────────── */

interface Article {
  id: number;
  article_type: string;
  slug: string;
  title: string;
  summary: string | null;
  status: string;
  tags: string[];
  published_at: string | null;
  created_at: string;
  updated_at: string;
  period_start: string | null;
  period_end: string | null;
}

interface Stats {
  articles: { total: number; draft: number; review: number; published: number };
  events: { total: number; dev_apps: number; building_permits: number; coa: number; council: number; council_votes: number };
}

const TYPE_LABELS: Record<string, string> = {
  weekly_brief: "Weekly Brief",
  coa_intelligence: "CoA Intelligence",
  explainer: "Policy Explainer",
  impact_brief: "Impact Brief",
  sp_mtsa_deep_dive: "SP/MTSA Deep Dive",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-amber-100 text-amber-800",
  review: "bg-blue-100 text-blue-800",
  published: "bg-green-100 text-green-800",
  archived: "bg-stone-200 text-stone-600",
};

/* ── Main Page ─────────────────────────────────────────────────────────── */

export default function AdminIntelligencePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("");

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [genType, setGenType] = useState("weekly_brief");
  const [genTopic, setGenTopic] = useState("");
  const [genResult, setGenResult] = useState("");

  // Ingest state
  const [ingesting, setIngesting] = useState(false);
  const [ingestResult, setIngestResult] = useState("");

  const [forbidden, setForbidden] = useState(false);

  const fetchArticles = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set("status", filterStatus);
      if (filterType) params.set("article_type", filterType);
      params.set("limit", "50");

      const res = await fetch(`/api/intel/admin/articles?${params}`);
      if (res.status === 403) {
        setForbidden(true);
        return;
      }
      const data = await res.json();
      setArticles(data.articles || []);
    } catch {
      setError("Failed to load articles");
    }
  }, [filterStatus, filterType]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/intel/admin/stats");
      if (res.ok) {
        setStats(await res.json());
      }
    } catch {}
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchArticles(), fetchStats()]).finally(() => setLoading(false));
  }, [fetchArticles, fetchStats]);

  /* ── Actions ──────────────────────────────────────────────────────────── */

  const handleIngest = async () => {
    setIngesting(true);
    setIngestResult("");
    try {
      const res = await fetch("/api/intel/admin/ingest", { method: "POST" });
      const data = await res.json();
      const lines = Object.entries(data).map(
        ([k, v]) => `${k}: ${(v as Record<string, number>).ingested ?? 0} ingested`
      );
      setIngestResult(lines.join(" · "));
      fetchStats();
    } catch {
      setIngestResult("Ingestion failed");
    } finally {
      setIngesting(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setGenResult("");
    try {
      const body: Record<string, string> = { article_type: genType };
      if (genTopic) body.topic = genTopic;

      const res = await fetch("/api/intel/admin/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.id) {
        setGenResult(`Draft created: "${data.title}" (ID ${data.id})`);
        fetchArticles();
      } else if (data.detail) {
        setGenResult(`Error: ${data.detail}`);
      } else {
        setGenResult(`Draft created: "${data.title}"`);
        fetchArticles();
      }
    } catch {
      setGenResult("Generation failed — check ANTHROPIC_API_KEY");
    } finally {
      setGenerating(false);
    }
  };

  const handlePublish = async (id: number) => {
    try {
      await fetch(`/api/intel/admin/articles/${id}/publish`, { method: "POST" });
      fetchArticles();
    } catch {}
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this article permanently?")) return;
    try {
      await fetch(`/api/intel/admin/articles/${id}`, { method: "DELETE" });
      fetchArticles();
    } catch {}
  };

  /* ── Forbidden state ──────────────────────────────────────────────────── */

  if (forbidden) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-stone-900">Access Denied</h1>
          <p className="mt-2 text-stone-500">
            You need the <code className="rounded bg-stone-200 px-1.5 py-0.5 text-sm">admin</code> role
            to access this page.
          </p>
          <p className="mt-1 text-xs text-stone-400">
            Set <code>{"{ \"role\": \"admin\" }"}</code> in your Clerk public metadata.
          </p>
          <Link href="/dashboard" className="mt-4 inline-block text-sm text-stone-600 underline">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  /* ── Render ───────────────────────────────────────────────────────────── */

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-[15px] font-bold tracking-tight text-stone-900 hover:text-stone-600">
              Toronto Zoning
            </Link>
            <span className="text-stone-300">/</span>
            <span className="text-[15px] font-semibold text-stone-700">Intelligence Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/intelligence" className="text-[12px] text-stone-400 hover:text-stone-600">
              View Public Page →
            </Link>
            {/* TODO: Re-add <UserButton /> when auth is re-enabled */}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 space-y-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
            <StatCard label="Total Articles" value={stats.articles.total} />
            <StatCard label="Drafts" value={stats.articles.draft} color="amber" />
            <StatCard label="Published" value={stats.articles.published} color="green" />
            <StatCard label="Events" value={stats.events.total} />
            <StatCard label="Dev Apps" value={stats.events.dev_apps} />
            <StatCard label="CoA Records" value={stats.events.coa} />
          </div>
        )}

        {/* Actions Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Ingest Panel */}
          <div className="rounded-lg border border-stone-200 bg-white p-5">
            <h2 className="text-[14px] font-semibold text-stone-800">Data Ingestion</h2>
            <p className="mt-1 text-[12px] text-stone-500">
              Pull latest data from Toronto Open Data (dev apps, permits, CoA, council).
            </p>
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={handleIngest}
                disabled={ingesting}
                className="rounded-md bg-stone-800 px-4 py-2 text-[13px] font-medium text-white hover:bg-stone-700 disabled:opacity-50"
              >
                {ingesting ? "Ingesting…" : "Run Ingestion"}
              </button>
              {ingestResult && (
                <span className="text-[12px] text-stone-500">{ingestResult}</span>
              )}
            </div>
          </div>

          {/* Generate Panel */}
          <div className="rounded-lg border border-stone-200 bg-white p-5">
            <h2 className="text-[14px] font-semibold text-stone-800">Generate Article</h2>
            <p className="mt-1 text-[12px] text-stone-500">
              AI-generate a draft article from ingested data. Requires ANTHROPIC_API_KEY.
            </p>
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-[11px] font-medium text-stone-500 mb-1">Type</label>
                <select
                  value={genType}
                  onChange={(e) => setGenType(e.target.value)}
                  className="rounded border border-stone-300 bg-white px-3 py-1.5 text-[13px] text-stone-800"
                >
                  {Object.entries(TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              {["explainer", "impact_brief", "sp_mtsa_deep_dive"].includes(genType) && (
                <div>
                  <label className="block text-[11px] font-medium text-stone-500 mb-1">Topic</label>
                  <input
                    type="text"
                    value={genTopic}
                    onChange={(e) => setGenTopic(e.target.value)}
                    placeholder="e.g. RD (d0.6) zone"
                    className="w-56 rounded border border-stone-300 px-3 py-1.5 text-[13px] text-stone-800"
                  />
                </div>
              )}
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="rounded-md bg-stone-800 px-4 py-2 text-[13px] font-medium text-white hover:bg-stone-700 disabled:opacity-50"
              >
                {generating ? "Generating…" : "Generate Draft"}
              </button>
            </div>
            {genResult && (
              <p className="mt-2 text-[12px] text-stone-500">{genResult}</p>
            )}
          </div>
        </div>

        {/* Articles Table */}
        <div className="rounded-lg border border-stone-200 bg-white">
          <div className="flex flex-wrap items-center gap-3 border-b border-stone-100 px-5 py-3">
            <h2 className="text-[14px] font-semibold text-stone-800">Articles</h2>
            <div className="flex-1" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded border border-stone-200 bg-stone-50 px-2 py-1 text-[12px] text-stone-600"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="review">Review</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="rounded border border-stone-200 bg-stone-50 px-2 py-1 text-[12px] text-stone-600"
            >
              <option value="">All Types</option>
              {Object.entries(TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="px-5 py-12 text-center text-[13px] text-stone-400">Loading…</div>
          ) : articles.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-[13px] text-stone-400">No articles yet.</p>
              <p className="mt-1 text-[12px] text-stone-400">
                Run ingestion first, then generate a draft.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {articles.map((a) => (
                <div key={a.id} className="flex items-center gap-4 px-5 py-3 hover:bg-stone-50">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/intelligence/${a.id}`}
                        className="truncate text-[13px] font-medium text-stone-800 hover:text-stone-600"
                      >
                        {a.title}
                      </Link>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[a.status] || "bg-stone-100 text-stone-500"}`}>
                        {a.status}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-3 text-[11px] text-stone-400">
                      <span>{TYPE_LABELS[a.article_type] || a.article_type}</span>
                      <span>·</span>
                      <span>{new Date(a.created_at).toLocaleDateString()}</span>
                      {a.period_start && (
                        <>
                          <span>·</span>
                          <span>Period: {a.period_start}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {a.status === "draft" && (
                      <button
                        onClick={() => handlePublish(a.id)}
                        className="rounded bg-green-50 px-3 py-1 text-[11px] font-medium text-green-700 hover:bg-green-100"
                      >
                        Publish
                      </button>
                    )}
                    <Link
                      href={`/admin/intelligence/${a.id}`}
                      className="rounded bg-stone-100 px-3 py-1 text-[11px] font-medium text-stone-600 hover:bg-stone-200"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="rounded px-3 py-1 text-[11px] font-medium text-red-500 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
            {error}
          </div>
        )}
      </main>
    </div>
  );
}

/* ── Stat Card ──────────────────────────────────────────────────────────── */

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  const bg = color === "amber" ? "bg-amber-50" : color === "green" ? "bg-green-50" : "bg-stone-50";
  const text = color === "amber" ? "text-amber-700" : color === "green" ? "text-green-700" : "text-stone-800";
  return (
    <div className={`rounded-lg border border-stone-200 ${bg} px-4 py-3`}>
      <p className="text-[11px] font-medium text-stone-500">{label}</p>
      <p className={`text-[22px] font-bold ${text}`}>{value.toLocaleString()}</p>
    </div>
  );
}
