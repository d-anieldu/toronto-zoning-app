"use client";

/**
 * ShareReportButton — Creates a shareable link for the current zoning report.
 * Shows a popover with the link and copy functionality.
 */

import { useState, useRef, useEffect } from "react";

interface Props {
  address: string;
  /** The full lookup data to store in the shared report */
  lookupData: Record<string, unknown>;
}

export default function ShareReportButton({ address, lookupData }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function handleShare() {
    if (shareUrl) {
      setOpen(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/reports/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          lookup_data: lookupData,
          expires_in_days: 90,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to share" }));
        throw new Error(err.detail || err.error || "Failed to create share link");
      }

      const data = await res.json();
      const url = `${window.location.origin}/report/${data.report_id}`;
      setShareUrl(url);
      setOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to share");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={handleShare}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-[11px] font-medium text-stone-600 shadow-sm transition-all hover:bg-stone-50 hover:shadow disabled:opacity-50"
      >
        {loading ? (
          <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
          </svg>
        )}
        Share
      </button>

      {/* Popover */}
      {open && shareUrl && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-stone-200 bg-white p-4 shadow-xl">
          <p className="text-[13px] font-semibold text-stone-900">Share this report</p>
          <p className="mt-1 text-[11px] text-stone-400">
            Anyone with this link can view the read-only report.
          </p>

          <div className="mt-3 flex items-center gap-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-[12px] text-stone-600 font-mono"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <button
              onClick={handleCopy}
              className={`shrink-0 rounded-lg px-3 py-2 text-[12px] font-medium transition-colors ${
                copied
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-stone-900 text-white hover:bg-stone-800"
              }`}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          <p className="mt-2 text-[10px] text-stone-400">
            Link expires in 90 days
          </p>
        </div>
      )}

      {error && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-red-200 bg-red-50 p-3 shadow-lg">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[12px] text-red-600">{error}</p>
            <button
              onClick={() => setError(null)}
              className="shrink-0 text-[12px] text-red-400 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
