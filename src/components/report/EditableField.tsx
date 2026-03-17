"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import { Pencil, Undo2 } from "lucide-react";
import { isEditable, getFieldConfig } from "@/lib/editable-fields";

export interface EditableFieldProps {
  /** Dot-notation path from the editable-fields whitelist */
  fieldPath: string;
  /** Current display value (edited or original) */
  value: unknown;
  /** Whether this field has been user-edited */
  isEdited: boolean;
  /** Original system value from lookup_data */
  original: unknown;
  /** User's note explaining the edit */
  editNote?: string;
  /** Called when the user commits an edit: `onEdit(fieldPath, newValue, note?)` */
  onEdit: (fieldPath: string, value: unknown, note?: string) => void;
  /** Called when the user reverts an edit */
  onRevert?: (fieldPath: string) => void;
  /** Whether the report is in edit mode */
  editMode: boolean;
  /** Override field type (defaults to whitelist config) */
  type?: "number" | "text" | "boolean";
  /** Children to render as the display value in view mode */
  children: ReactNode;
}

export default function EditableField({
  fieldPath,
  value,
  isEdited,
  original,
  editNote,
  onEdit,
  onRevert,
  editMode,
  type: typeProp,
  children,
}: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value ?? ""));
  const inputRef = useRef<HTMLInputElement>(null);

  const config = getFieldConfig(fieldPath);
  const fieldType = typeProp ?? config?.type ?? "text";
  const editable = isEditable(fieldPath);

  // Focus input when entering inline edit
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  // Not in edit mode or not whitelisted → pass-through
  if (!editMode || !editable) {
    return <>{children}</>;
  }

  // ── Boolean toggle ──
  if (fieldType === "boolean") {
    const boolVal = value === true || value === "true";
    return (
      <span className="inline-flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onEdit(fieldPath, !boolVal)}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
            boolVal ? "bg-stone-800" : "bg-stone-300"
          }`}
          role="switch"
          aria-checked={boolVal}
          aria-label={config?.label ?? fieldPath}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
              boolVal ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </button>
        {isEdited && <EditedBadge original={original} editNote={editNote} onRevert={onRevert ? () => onRevert(fieldPath) : undefined} />}
      </span>
    );
  }

  // ── Inline editing (number / text) ──
  if (editing) {
    return (
      <input
        ref={inputRef}
        type={fieldType === "number" ? "number" : "text"}
        step={fieldType === "number" ? "any" : undefined}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => commitEdit()}
        onKeyDown={(e) => {
          if (e.key === "Enter") commitEdit();
          if (e.key === "Escape") cancelEdit();
        }}
        className="w-full min-w-[60px] rounded border border-stone-300 bg-white px-1.5 py-0.5 text-[13px] font-medium text-stone-900 outline-none focus:border-stone-500 focus:ring-1 focus:ring-stone-400"
        aria-label={config?.label ?? fieldPath}
      />
    );
  }

  // ── Display with pencil icon ──
  return (
    <span className="group/edit inline-flex items-center gap-1">
      <span
        role="button"
        tabIndex={0}
        onClick={startEdit}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") startEdit(); }}
        className="cursor-pointer rounded px-0.5 transition-colors hover:bg-stone-100"
        title="Click to edit"
      >
        {children}
      </span>
      <button
        type="button"
        onClick={startEdit}
        className="opacity-0 transition-opacity group-hover/edit:opacity-100"
        aria-label={`Edit ${config?.label ?? fieldPath}`}
      >
        <Pencil className="h-3 w-3 text-stone-400 hover:text-stone-600" />
      </button>
      {isEdited && <EditedBadge original={original} editNote={editNote} onRevert={onRevert ? () => onRevert(fieldPath) : undefined} />}
    </span>
  );

  function startEdit() {
    setDraft(String(value ?? ""));
    setEditing(true);
  }

  function commitEdit() {
    setEditing(false);
    const parsed = fieldType === "number" ? parseFloat(draft) : draft;
    if (parsed !== value && !(fieldType === "number" && isNaN(parsed as number))) {
      onEdit(fieldPath, parsed);
    }
  }

  function cancelEdit() {
    setEditing(false);
    setDraft(String(value ?? ""));
  }
}

// ── Edited badge with tooltip ──

function EditedBadge({
  original,
  editNote,
  onRevert,
}: {
  original: unknown;
  editNote?: string;
  onRevert?: () => void;
}) {
  const [showTip, setShowTip] = useState(false);

  return (
    <span className="relative inline-flex items-center">
      <span
        className="cursor-default rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0 text-[10px] font-semibold text-amber-700"
        onMouseEnter={() => setShowTip(true)}
        onMouseLeave={() => setShowTip(false)}
      >
        Edited
      </span>
      {showTip && (
        <span className="absolute bottom-full left-1/2 z-50 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-lg border border-stone-200 bg-white px-3 py-2 text-[11px] text-stone-600 shadow-lg">
          <span className="block font-medium text-stone-400">Original</span>
          <span className="font-semibold text-stone-800">{String(original ?? "—")}</span>
          {editNote && (
            <>
              <span className="mt-1 block font-medium text-stone-400">Note</span>
              <span className="text-stone-700">{editNote}</span>
            </>
          )}
          {onRevert && (
            <button
              type="button"
              onClick={onRevert}
              className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-stone-500 hover:text-stone-800"
            >
              <Undo2 className="h-3 w-3" />
              Revert
            </button>
          )}
        </span>
      )}
    </span>
  );
}
