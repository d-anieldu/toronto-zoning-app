"use client";

import { useEffect, useState, use } from "react";
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

export default function ArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const res = await fetch(`/api/intel/articles/${slug}`);
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setArticle(data);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <p className="text-[13px] text-stone-400">Loading…</p>
      </div>
    );
  }

  if (notFound || !article) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50">
        <h1 className="text-[18px] font-bold text-stone-700">Article Not Found</h1>
        <p className="mt-1 text-[13px] text-stone-500">This article may have been removed or is not yet published.</p>
        <Link href="/intelligence" className="mt-4 text-[13px] text-stone-600 underline">
          ← Back to Intelligence
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Top bar */}
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-3xl px-6 py-3">
          <Link href="/intelligence" className="text-[12px] text-stone-400 hover:text-stone-600">
            ← Planning Intelligence
          </Link>
        </div>
      </header>

      {/* Article */}
      <article className="mx-auto max-w-3xl px-6 py-10">
        {/* Meta */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span
            className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
              TYPE_COLORS[article.article_type] || "bg-stone-50 text-stone-600"
            }`}
          >
            {TYPE_LABELS[article.article_type] || article.article_type}
          </span>
          {article.published_at && (
            <span className="text-[12px] text-stone-400">
              {new Date(article.published_at).toLocaleDateString("en-CA", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          )}
          {article.period_start && (
            <span className="text-[11px] text-stone-400">
              · Period: {article.period_start}
              {article.period_end ? ` – ${article.period_end}` : ""}
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-[26px] font-bold leading-snug text-stone-900 tracking-tight">
          {article.title}
        </h1>
        {article.subtitle && (
          <p className="mt-2 text-[16px] text-stone-600">{article.subtitle}</p>
        )}

        {/* Tags */}
        {article.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {article.tags.map((t) => (
              <span
                key={t}
                className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[10px] font-medium text-stone-500"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Divider */}
        <hr className="my-6 border-stone-200" />

        {/* Body */}
        <div
          className="prose prose-stone prose-sm max-w-none
            prose-headings:tracking-tight prose-headings:text-stone-900
            prose-h2:text-[18px] prose-h2:mt-8 prose-h2:mb-3 prose-h2:border-b prose-h2:border-stone-200 prose-h2:pb-1
            prose-h3:text-[15px] prose-h3:mt-6 prose-h3:mb-2
            prose-p:text-[13.5px] prose-p:leading-relaxed prose-p:text-stone-700
            prose-li:text-[13px] prose-li:text-stone-700
            prose-a:text-blue-600 prose-a:font-medium
            prose-strong:text-stone-800"
          dangerouslySetInnerHTML={{
            __html: renderMarkdown(article.body_md),
          }}
        />

        {/* Footer */}
        <div className="mt-10 rounded-lg border border-stone-200 bg-stone-100/50 p-4">
          <p className="text-[11px] text-stone-500 leading-relaxed">
            This article was generated using AI ({article.ai_model || "Claude"}) from
            Toronto Open Data sources and reviewed by editorial staff before
            publication. It is intended for informational purposes and does not
            constitute legal or planning advice.
          </p>
        </div>

        <div className="mt-8">
          <Link href="/intelligence" className="text-[13px] font-medium text-stone-600 hover:text-stone-800">
            ← Back to all articles
          </Link>
        </div>
      </article>
    </div>
  );
}

/* ── Markdown → HTML ────────────────────────────────────────────────────── */

function renderMarkdown(md: string): string {
  // Escape HTML
  let html = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Code blocks (```)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, _lang, code) => {
    return `<pre class="bg-stone-100 p-4 rounded-lg overflow-x-auto text-[12px]"><code>${code.trim()}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="bg-stone-100 px-1 py-0.5 rounded text-[12px]">$1</code>');

  // Headers
  html = html.replace(/^#### (.+)$/gm, '<h4 class="text-[14px] font-semibold mt-5 mb-1">$1</h4>');
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, '<h1 class="text-[22px] font-bold mt-8 mb-3">$1</h1>');

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr class="my-6 border-stone-200">');

  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Links
  html = html.replace(
    /\[(.+?)\]\((.+?)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  // Bullet lists — group consecutive lines starting with "- "
  html = html.replace(
    /(^- .+$(\n^- .+$)*)/gm,
    (block) => {
      const items = block
        .split("\n")
        .map((line) => `<li>${line.replace(/^- /, "")}</li>`)
        .join("");
      return `<ul>${items}</ul>`;
    }
  );

  // Numbered lists
  html = html.replace(
    /(^\d+\. .+$(\n^\d+\. .+$)*)/gm,
    (block) => {
      const items = block
        .split("\n")
        .map((line) => `<li>${line.replace(/^\d+\. /, "")}</li>`)
        .join("");
      return `<ol>${items}</ol>`;
    }
  );

  // Blockquotes
  html = html.replace(
    /(^&gt; .+$(\n^&gt; .+$)*)/gm,
    (block) => {
      const text = block.replace(/^&gt; /gm, "");
      return `<blockquote class="border-l-3 border-stone-300 pl-4 italic text-stone-600">${text}</blockquote>`;
    }
  );

  // Paragraphs: double newlines
  html = html.replace(/\n{2,}/g, "</p><p>");
  // Single newlines within paragraphs
  html = html.replace(/\n/g, "<br>");
  // Wrap
  html = `<p>${html}</p>`;
  // Clean empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, "");
  // Clean <p> wrapping block elements
  html = html.replace(/<p>(<(?:h[1-4]|ul|ol|pre|hr|blockquote))/g, "$1");
  html = html.replace(/(<\/(?:h[1-4]|ul|ol|pre|hr|blockquote)>)<\/p>/g, "$1");

  return html;
}
