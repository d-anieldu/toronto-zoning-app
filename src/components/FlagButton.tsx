"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";

interface FlagButtonProps {
  address: string;
  fieldPath: string;
  fieldLabel: string;
  currentValue: string;
  tabName: string;
  reportData?: Record<string, unknown>;
  reportId?: string;
}

export default function FlagButton({
  address,
  fieldPath,
  fieldLabel,
  currentValue,
  tabName,
  reportData,
  reportId,
}: FlagButtonProps) {
  const [open, setOpen] = useState(false);
  const [suggested, setSuggested] = useState("");
  const [source, setSource] = useState("");
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error: insertError } = await supabase
      .from("feedback_reports")
      .insert({
        user_id: user?.id ?? null,
        address,
        field_path: fieldPath,
        field_label: fieldLabel,
        tab_name: tabName,
        current_value: currentValue,
        suggested_value: suggested || null,
        source_url: source || null,
        reason,
        report_data: reportData ?? null,
        report_id: reportId ?? null,
      });

    setLoading(false);

    if (insertError) {
      if (insertError.message.includes("row-level security")) {
        setError("Please sign in to submit feedback.");
      } else {
        setError(insertError.message);
      }
      return;
    }

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <span className="text-[10px] text-emerald-600 ml-2">
        ✓ Reported — thank you
      </span>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="text-[10px] text-stone-300 hover:text-red-500 ml-1 opacity-40 group-hover:opacity-100 transition-opacity"
        title="Flag this value as incorrect"
      >
        ⚑
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
          onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4"
          >
            <h3 className="text-[15px] font-semibold text-stone-900">
              Report an issue
            </h3>
            <p className="text-[12px] text-stone-500">
              <strong>{fieldLabel}</strong> currently shows:{" "}
              <code className="rounded bg-stone-100 px-1.5 py-0.5 text-[11px]">
                {currentValue}
              </code>
            </p>

            {error && (
              <p className="rounded-lg bg-red-50 p-3 text-[12px] text-red-600">
                {error}
              </p>
            )}

            <label className="block">
              <span className="text-[12px] font-medium text-stone-600">
                What should it be?
              </span>
              <input
                type="text"
                value={suggested}
                onChange={(e) => setSuggested(e.target.value)}
                placeholder="e.g. 12.0m"
                className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-[13px] outline-none focus:border-stone-400"
              />
            </label>

            <label className="block">
              <span className="text-[12px] font-medium text-stone-600">
                Source / reference
              </span>
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="Link to bylaw section, page number, etc."
                className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-[13px] outline-none focus:border-stone-400"
              />
            </label>

            <label className="block">
              <span className="text-[12px] font-medium text-stone-600">
                Why is this wrong? *
              </span>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                rows={3}
                placeholder="Explain the issue…"
                className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-[13px] outline-none focus:border-stone-400 resize-none"
              />
            </label>

            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-lg bg-stone-900 py-2.5 text-[13px] font-semibold text-white hover:bg-stone-800 disabled:opacity-50 transition-colors"
              >
                {loading ? "Submitting…" : "Submit report"}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-lg border border-stone-200 py-2.5 text-[13px] font-medium text-stone-600 hover:bg-stone-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
