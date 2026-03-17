"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { StickyNote } from "lucide-react";

interface SectionNoteEditorProps {
  sectionId: string;
  note: string;
  onNoteChange: (sectionId: string, note: string) => void;
  editMode: boolean;
}

export default function SectionNoteEditor({
  sectionId,
  note,
  onNoteChange,
  editMode,
}: SectionNoteEditorProps) {
  const [expanded, setExpanded] = useState(!!note);
  const [draft, setDraft] = useState(note);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync when note changes externally (e.g. after save round-trip)
  useEffect(() => {
    setDraft(note);
    if (note) setExpanded(true);
  }, [note]);

  // Auto-focus textarea when expanding from empty
  useEffect(() => {
    if (expanded && !note && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [expanded, note]);

  const debouncedChange = useCallback(
    (value: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onNoteChange(sectionId, value);
      }, 500);
    },
    [onNoteChange, sectionId],
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  if (!editMode) return null;

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="mt-3 flex items-center gap-1.5 rounded-lg border border-dashed border-stone-300 px-3 py-2 text-[12px] font-medium text-stone-400 transition-colors hover:border-stone-400 hover:text-stone-600"
      >
        <StickyNote className="h-3.5 w-3.5" />
        Add note
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-lg border border-stone-200 bg-stone-50 p-3">
      <div className="mb-1.5 flex items-center gap-1.5">
        <StickyNote className="h-3.5 w-3.5 text-stone-400" />
        <span className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
          Section Note
        </span>
      </div>
      <textarea
        ref={textareaRef}
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          debouncedChange(e.target.value);
        }}
        rows={3}
        placeholder="Add your analysis, context, or instructions…"
        className="w-full resize-y rounded border border-stone-200 bg-white px-2.5 py-2 text-[13px] text-stone-700 placeholder:text-stone-300 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-300"
      />
      {draft && (
        <button
          type="button"
          onClick={() => {
            setDraft("");
            onNoteChange(sectionId, "");
            setExpanded(false);
          }}
          className="mt-1 text-[11px] font-medium text-stone-400 hover:text-stone-600"
        >
          Remove note
        </button>
      )}
    </div>
  );
}
