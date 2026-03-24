"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { UserReport, UserEdits, SectionNotes } from "@/types/reports";
import ReportHeader from "@/components/report/ReportHeader";
import ReportFlagSummary from "@/components/report/ReportFlagSummary";
import PdfExportButton from "@/components/report/PdfExportButton";
import ZoningReport from "@/components/ZoningReport";

interface ReportEditorProps {
  initialReport: UserReport;
}

export default function ReportEditor({ initialReport }: ReportEditorProps) {
  const router = useRouter();
  const [report, setReport] = useState<UserReport>(initialReport);
  const [userEdits, setUserEdits] = useState<UserEdits>(initialReport.user_edits || {});
  const [sectionNotes, setSectionNotes] = useState<SectionNotes>(initialReport.section_notes || {});
  const [updatedAt, setUpdatedAt] = useState(initialReport.updated_at);
  const [saving, setSaving] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPatch = useRef<Record<string, any>>({});

  // ── Autosave: debounce 1s, PATCH with concurrency ──

  const flushSave = useCallback(async () => {
    const patch = { ...pendingPatch.current };
    pendingPatch.current = {};

    if (Object.keys(patch).length === 0) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/reports/${report.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...patch, if_updated_at: updatedAt }),
      });

      if (res.status === 409) {
        // Concurrency conflict — re-fetch and merge
        await res.json();
        const refetch = await fetch(`/api/reports/${report.id}`);
        if (refetch.ok) {
          const fresh: UserReport = await refetch.json();
          setReport(fresh);
          setUserEdits(fresh.user_edits || {});
          setSectionNotes(fresh.section_notes || {});
          setUpdatedAt(fresh.updated_at);
          toast.info("Report was updated elsewhere. Reloaded latest version.");
        }
        return;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Failed to save changes");
        return;
      }

      const updated: UserReport = await res.json();
      setUpdatedAt(updated.updated_at);
      setReport((prev) => ({ ...prev, updated_at: updated.updated_at }));
    } catch {
      toast.error("Network error — changes will retry on next edit");
    } finally {
      setSaving(false);
    }
  }, [report.id, updatedAt]);

  const scheduleSave = useCallback(
    (patch: Record<string, any>) => {
      // Merge into pending
      for (const [key, val] of Object.entries(patch)) {
        if (key === "user_edits" && pendingPatch.current.user_edits) {
          pendingPatch.current.user_edits = { ...pendingPatch.current.user_edits, ...val };
        } else if (key === "section_notes" && pendingPatch.current.section_notes) {
          pendingPatch.current.section_notes = { ...pendingPatch.current.section_notes, ...val };
        } else if (key === "remove_edit_paths" && pendingPatch.current.remove_edit_paths) {
          pendingPatch.current.remove_edit_paths = [...pendingPatch.current.remove_edit_paths, ...val];
        } else {
          pendingPatch.current[key] = val;
        }
      }

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(flushSave, 1000);
    },
    [flushSave],
  );

  // ── Handlers ──

  const handleEditField = useCallback(
    (fieldPath: string, value: unknown, note?: string) => {
      const edit = { value, note, edited_at: new Date().toISOString() };
      setUserEdits((prev) => ({ ...prev, [fieldPath]: edit }));
      scheduleSave({ user_edits: { [fieldPath]: edit } });
    },
    [scheduleSave],
  );

  const handleRevertField = useCallback(
    (fieldPath: string) => {
      setUserEdits((prev) => {
        const next = { ...prev };
        delete next[fieldPath];
        return next;
      });
      scheduleSave({ remove_edit_paths: [fieldPath] });
    },
    [scheduleSave],
  );

  const handleEditNote = useCallback(
    (sectionId: string, note: string) => {
      setSectionNotes((prev) => {
        if (!note) {
          const next = { ...prev };
          delete next[sectionId];
          return next;
        }
        return { ...prev, [sectionId]: note };
      });
      scheduleSave({ section_notes: { [sectionId]: note } });
    },
    [scheduleSave],
  );

  const handleTitleChange = useCallback(
    (title: string) => {
      setReport((prev) => ({ ...prev, title }));
      scheduleSave({ title });
    },
    [scheduleSave],
  );

  const handleDelete = useCallback(async () => {
    try {
      const res = await fetch(`/api/reports/${report.id}`, { method: "DELETE" });
      if (res.ok || res.status === 204) {
        toast.success("Report deleted");
        router.push("/reports");
      } else {
        toast.error("Failed to delete report");
      }
    } catch {
      toast.error("Network error");
    }
  }, [report.id, router]);

  const [flagCount, setFlagCount] = useState(0);
  const editCount = Object.keys(userEdits).length;

  // Fetch flag count on mount
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/reports/${report.id}/flags`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!cancelled && json?.flags) setFlagCount(json.flags.length);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [report.id]);

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="w-full px-6 py-6">
        {/* Saving indicator */}
        {saving && (
          <div className="fixed right-4 top-4 z-50 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-[11px] font-medium text-stone-500 shadow-sm">
            Saving…
          </div>
        )}

        <ReportHeader
          report={report}
          editCount={editCount}
          flagCount={flagCount}
          onTitleChange={handleTitleChange}
          onDelete={handleDelete}
        />

        <div className="mt-4">
          <ReportFlagSummary reportId={report.id} />
        </div>

        <div className="mt-3 flex justify-end" data-no-pdf>
          <PdfExportButton
            address={(report.lookup_data as any)?.address || report.address}
            zoneCode={(report.lookup_data as any)?.effective_standards?.zone_code}
          />
        </div>

        <div className="mt-3" data-report-container>
          <ZoningReport
            data={report.lookup_data as any}
            editMode={true}
            userEdits={userEdits}
            sectionNotes={sectionNotes}
            onEditField={handleEditField}
            onRevertField={handleRevertField}
            onEditNote={handleEditNote}
            reportId={report.id}
          />
        </div>
      </div>
    </div>
  );
}
