/**
 * Report edit helpers — read values through the user-edit overlay.
 *
 * Every tab component should use `getFieldValue()` instead of
 * reading `lookup_data` directly so that user overrides are honoured.
 */

import type { UserEdits, UserEdit } from "@/types/reports";

// Re-export for convenience so consumers only need one import
export type { UserReport, UserEdit, UserEdits, SectionNotes } from "@/types/reports";

// ---------- Public types ----------

export interface FieldValue<T = unknown> {
  /** The value to display — user's edit if present, otherwise original. */
  value: T;
  /** True when the user has overridden this field. */
  isEdited: boolean;
  /** Always the system value from lookup_data. */
  original: T;
  /** User's note explaining the edit, if any. */
  editNote?: string;
}

// ---------- Helpers ----------

/**
 * Safely traverse a dot-notation path on a nested object.
 *
 * e.g. `getNestedValue(data, "effective_standards.height.effective_m")`
 */
export function getNestedValue(obj: unknown, dotPath: string): unknown {
  if (obj == null || typeof obj !== "object") return undefined;
  const segments = dotPath.split(".");
  let current: unknown = obj;
  for (const seg of segments) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[seg];
  }
  return current;
}

/**
 * Read a field through the user-edit overlay.
 *
 * Returns the edited value when one exists, otherwise the original
 * value from the lookup data. Always includes `isEdited` so the UI
 * can show an "Edited" badge and the original value on hover.
 */
export function getFieldValue<T = unknown>(
  lookupData: Record<string, unknown>,
  userEdits: UserEdits | undefined | null,
  fieldPath: string,
  fallback?: T,
): FieldValue<T> {
  const original = (getNestedValue(lookupData, fieldPath) as T) ?? (fallback as T);

  const edit: UserEdit | undefined = userEdits?.[fieldPath];
  if (edit !== undefined) {
    return {
      value: edit.value as T,
      isEdited: true,
      original,
      editNote: edit.note,
    };
  }

  return {
    value: original,
    isEdited: false,
    original,
  };
}
