"use client";

import { useEffect, useState, use } from "react";
// TODO: Re-add UserButton when auth is re-enabled
import Link from "next/link";

/* ── Types ─────────────────────────────────────────────────────────────── */

interface Article {
  id: number;
  article_type: string;
  slug: string;
  title: string;
  subtitle: string | null;
  summary: string | null;
  body_md: string;
  status: string;
  tags: string[];
  geo_scope: string | null;
  ai_model: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  period_start: string | null;
  period_end: string | null;
  edit_history?: Array<{
    id: number;
    editor_id: string;
    action: string;
    created_at: string;
  }>;
}

/* ── Main Page ─────────────────────────────────────────────────────────── */

export default function AdminArticleEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Editable fields
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [summary, setSummary] = useState("");
  const [bodyMd, setBodyMd] = useState("");
  const [tags, setTags] = useState("");
  const [slug, setSlug] = useState("");
  const [status, setStatus] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const res = await fetch(`/api/intel/admin/articles/${id}`);
        if (!res.ok) throw new Error("Failed to load article");
        const data = await res.json();
        setArticle(data);
        setTitle(data.title || "");
        setSubtitle(data.subtitle || "");
        setSummary(data.summary || "");
        setBodyMd(data.body_md || "");
        setTags((data.tags || []).join(", "));
        setSlug(data.slug || "");
        setStatus(data.status || "draft");
      } catch {
        setError("Failed to load article");
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/intel/admin/articles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          subtitle: subtitle || null,
          summary: summary || null,
          body_md: bodyMd,
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
          slug,
          status,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      const updated = await res.json();
      setArticle(updated);
      setSuccess("Saved successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    try {
      const res = await fetch(`/api/intel/admin/articles/${id}/publish`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Publish failed");
      const updated = await res.json();
      setArticle(updated);
      setStatus("published");
      setSuccess("Article published!");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Failed to publish");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <p className="text-[13px] text-stone-400">Loading…</p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <div className="text-center">
          <p className="text-[13px] text-stone-500">Article not found</p>
          <Link href="/admin/intelligence" className="mt-2 inline-block text-sm text-stone-600 underline">
            ← Back
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Link href="/admin/intelligence" className="text-[13px] text-stone-400 hover:text-stone-600">
              ← Intelligence Admin
            </Link>
            <span className="text-stone-300">/</span>
            <span className="text-[13px] font-medium text-stone-700 truncate max-w-xs">
              {article.title}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {success && (
              <span className="text-[12px] text-green-600">{success}</span>
            )}
            {error && (
              <span className="text-[12px] text-red-600">{error}</span>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-md bg-stone-800 px-4 py-1.5 text-[13px] font-medium text-white hover:bg-stone-700 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            {status !== "published" && (
              <button
                onClick={handlePublish}
                className="rounded-md bg-green-600 px-4 py-1.5 text-[13px] font-medium text-white hover:bg-green-700"
              >
                Publish
              </button>
            )}
            {/* TODO: Re-add <UserButton /> when auth is re-enabled */}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          {/* Editor */}
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-[11px] font-medium text-stone-500 mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded border border-stone-300 px-3 py-2 text-[15px] font-semibold text-stone-800"
              />
            </div>

            {/* Subtitle */}
            <div>
              <label className="block text-[11px] font-medium text-stone-500 mb-1">Subtitle</label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full rounded border border-stone-300 px-3 py-2 text-[13px] text-stone-700"
              />
            </div>

            {/* Summary */}
            <div>
              <label className="block text-[11px] font-medium text-stone-500 mb-1">Summary (excerpt)</label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={2}
                className="w-full rounded border border-stone-300 px-3 py-2 text-[13px] text-stone-700"
              />
            </div>

            {/* Body — Markdown editor vs preview */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-[11px] font-medium text-stone-500">Body (Markdown)</label>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="text-[11px] text-stone-400 hover:text-stone-600"
                >
                  {showPreview ? "← Edit" : "Preview →"}
                </button>
              </div>
              {showPreview ? (
                <div
                  className="prose prose-stone prose-sm max-w-none rounded border border-stone-200 bg-white px-4 py-4 min-h-[500px]"
                  dangerouslySetInnerHTML={{
                    __html: simpleMarkdown(bodyMd),
                  }}
                />
              ) : (
                <textarea
                  value={bodyMd}
                  onChange={(e) => setBodyMd(e.target.value)}
                  rows={25}
                  className="w-full rounded border border-stone-300 bg-white px-4 py-3 font-mono text-[12px] text-stone-800 leading-relaxed"
                  spellCheck
                />
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Status */}
            <div className="rounded-lg border border-stone-200 bg-white p-4">
              <label className="block text-[11px] font-medium text-stone-500 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded border border-stone-300 px-3 py-1.5 text-[13px] text-stone-800"
              >
                <option value="draft">Draft</option>
                <option value="review">Review</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Slug */}
            <div className="rounded-lg border border-stone-200 bg-white p-4">
              <label className="block text-[11px] font-medium text-stone-500 mb-1">URL Slug</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full rounded border border-stone-300 px-3 py-1.5 font-mono text-[12px] text-stone-700"
              />
              {status === "published" && slug && (
                <Link
                  href={`/intelligence/${slug}`}
                  className="mt-1 block text-[11px] text-blue-600 hover:underline"
                  target="_blank"
                >
                  /intelligence/{slug} ↗
                </Link>
              )}
            </div>

            {/* Tags */}
            <div className="rounded-lg border border-stone-200 bg-white p-4">
              <label className="block text-[11px] font-medium text-stone-500 mb-1">Tags (comma-separated)</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full rounded border border-stone-300 px-3 py-1.5 text-[12px] text-stone-700"
              />
            </div>

            {/* Metadata */}
            <div className="rounded-lg border border-stone-200 bg-white p-4 space-y-2">
              <h3 className="text-[11px] font-semibold text-stone-500 uppercase tracking-wide">Metadata</h3>
              <MetaRow label="Type" value={article.article_type} />
              <MetaRow label="AI Model" value={article.ai_model || "—"} />
              <MetaRow label="Created" value={new Date(article.created_at).toLocaleString()} />
              <MetaRow label="Updated" value={new Date(article.updated_at).toLocaleString()} />
              {article.published_at && (
                <MetaRow label="Published" value={new Date(article.published_at).toLocaleString()} />
              )}
              {article.period_start && (
                <MetaRow label="Period" value={`${article.period_start} → ${article.period_end || "—"}`} />
              )}
            </div>

            {/* Edit History */}
            {article.edit_history && article.edit_history.length > 0 && (
              <div className="rounded-lg border border-stone-200 bg-white p-4">
                <h3 className="text-[11px] font-semibold text-stone-500 uppercase tracking-wide mb-2">Edit History</h3>
                <div className="space-y-1.5">
                  {article.edit_history.slice(0, 10).map((h) => (
                    <div key={h.id} className="text-[11px] text-stone-500">
                      <span className="font-medium text-stone-600">{h.action}</span>
                      {" · "}
                      {new Date(h.created_at).toLocaleString()}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

/* ── Helpers ────────────────────────────────────────────────────────────── */

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-[11px]">
      <span className="text-stone-400">{label}</span>
      <span className="text-stone-600 text-right truncate max-w-[160px]">{value}</span>
    </div>
  );
}

/** Minimal Markdown → HTML for preview (h2, h3, bold, italic, bullets, links) */
/** Strip dangerous URI schemes from markdown-generated links */
function sanitizeUrl(url: string): string {
  const decoded = decodeURIComponent(url).replace(/\s/g, "").toLowerCase();
  if (/^(javascript|data|vbscript):/i.test(decoded)) return "#";
  return url;
}

function simpleMarkdown(md: string): string {
  return md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="text-[15px] font-semibold text-stone-800 mt-5 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-[17px] font-bold text-stone-900 mt-6 mb-2 border-b border-stone-200 pb-1">$1</h2>')
    // Bold & italic
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Bullet lists
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-[13px] text-stone-700">$1</li>')
    // Links
    .replace(/\[(.+?)\]\((.+?)\)/g, (_m: string, text: string, url: string) => `<a href="${sanitizeUrl(url)}" class="text-blue-600 underline" target="_blank">${text}</a>`)
    // Paragraphs
    .replace(/\n{2,}/g, '</p><p class="text-[13px] text-stone-700 leading-relaxed mb-3">')
    .replace(/\n/g, "<br>")
    // Wrap
    .replace(/^/, '<p class="text-[13px] text-stone-700 leading-relaxed mb-3">')
    .concat("</p>");
}
