"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Pencil, Trash2, Loader2 } from "lucide-react";
import type { UserReport } from "@/types/reports";
import { getNestedValue } from "@/lib/report-edits";

interface ReportHeaderProps {
  report: UserReport;
  editCount: number;
  flagCount: number;
  onTitleChange: (title: string) => void;
  onDelete: () => void;
}

export default function ReportHeader({
  report,
  editCount,
  flagCount,
  onTitleChange,
  onDelete,
}: ReportHeaderProps) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(report.title || report.address);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const zoneCode = String(
    getNestedValue(report.lookup_data, "effective_standards.zone_code") || ""
  );

  // Desktop-only check
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Sync title from prop
  useEffect(() => {
    setTitleDraft(report.title || report.address);
  }, [report.title, report.address]);

  // Focus input when editing
  useEffect(() => {
    if (editingTitle && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingTitle]);

  function commitTitle() {
    setEditingTitle(false);
    const trimmed = titleDraft.trim();
    if (trimmed && trimmed !== report.title) {
      onTitleChange(trimmed);
    } else {
      setTitleDraft(report.title || report.address);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    onDelete();
  }

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-CA", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="space-y-3">
      {/* Mobile banner */}
      {isMobile && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] font-medium text-amber-800">
          Editing available on desktop
        </div>
      )}

      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        {/* Back link */}
        <Link
          href="/reports"
          className="mb-3 inline-flex items-center gap-1.5 text-[12px] font-medium text-stone-400 transition-colors hover:text-stone-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          My Reports
        </Link>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          {/* Left: title + address + dates */}
          <div className="min-w-0 flex-1">
            {/* Editable title */}
            {editingTitle && !isMobile ? (
              <input
                ref={inputRef}
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={commitTitle}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitTitle();
                  if (e.key === "Escape") {
                    setEditingTitle(false);
                    setTitleDraft(report.title || report.address);
                  }
                }}
                className="w-full rounded border border-stone-300 px-2 py-1 text-[22px] font-bold tracking-tight text-stone-900 outline-none focus:border-stone-500 focus:ring-1 focus:ring-stone-400"
              />
            ) : (
              <div className="group flex items-center gap-2">
                <h1 className="text-[22px] font-bold tracking-tight text-stone-900 truncate">
                  {report.title || report.address}
                </h1>
                {!isMobile && (
                  <button
                    type="button"
                    onClick={() => setEditingTitle(true)}
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label="Edit title"
                  >
                    <Pencil className="h-3.5 w-3.5 text-stone-400 hover:text-stone-600" />
                  </button>
                )}
              </div>
            )}

            {/* Address subtitle (when title differs from address) */}
            {report.title && report.title !== report.address && (
              <p className="mt-0.5 text-[13px] text-stone-500">{report.address}</p>
            )}

            {/* Dates */}
            <p className="mt-1.5 text-[11px] text-stone-400">
              Created {fmtDate(report.created_at)}
              {report.updated_at !== report.created_at && (
                <> · Updated {fmtDate(report.updated_at)}</>
              )}
            </p>
          </div>

          {/* Right: badges + actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Zone badge */}
            {zoneCode && (
              <span className="rounded-lg bg-stone-900 px-3 py-1.5 text-[13px] font-bold tracking-wide text-white">
                {zoneCode}
              </span>
            )}

            {/* Edit count badge */}
            {editCount > 0 && (
              <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
                {editCount} edit{editCount !== 1 ? "s" : ""}
              </span>
            )}

            {/* Flag count badge */}
            {flagCount > 0 && (
              <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-[11px] font-semibold text-red-700">
                {flagCount} flag{flagCount !== 1 ? "s" : ""}
              </span>
            )}

            {/* Delete button */}
            {!isMobile && !confirmDelete && (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-[11px] font-medium text-stone-500 shadow-sm transition-colors hover:border-red-200 hover:text-red-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            )}

            {/* Delete confirmation */}
            {!isMobile && confirmDelete && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5">
                <span className="text-[11px] font-medium text-red-700">
                  This cannot be undone
                </span>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="rounded bg-red-600 px-2 py-0.5 text-[11px] font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting ? (
                    <Loader2 className="inline h-3 w-3 animate-spin" />
                  ) : (
                    "Confirm"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="text-[11px] font-medium text-stone-500 hover:text-stone-700"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
