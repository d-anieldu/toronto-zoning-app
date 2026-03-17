/**
 * User Reports — shared TypeScript types.
 *
 * Used by API routes, components, and helpers across Phases 1–3.
 * Mirrors the `user_reports` table + API request/response shapes.
 */

// ---------- Database row ----------

export interface UserReport {
  id: string;
  user_id: string;
  address: string;
  lookup_data: Record<string, unknown>;
  user_edits: UserEdits;
  section_notes: SectionNotes;
  title: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

// ---------- Edit types ----------

export interface UserEdit {
  value: unknown;
  note?: string;
  edited_at: string;
}

/** Dot-notation field path → edit override */
export type UserEdits = Record<string, UserEdit>;

/** Tab/section id → free-text note */
export type SectionNotes = Record<string, string>;

// ---------- API request types ----------

export interface CreateReportRequest {
  address: string;
  lookup_data: Record<string, unknown>;
  title?: string;
}

export interface PatchReportRequest {
  title?: string;
  user_edits?: UserEdits;
  remove_edit_paths?: string[];
  section_notes?: SectionNotes;
  if_updated_at?: string;
}

// ---------- API response types ----------

export interface CreateReportResponse {
  id: string;
  address: string;
  title: string;
  created_at: string;
}

export interface ReportListItem {
  id: string;
  address: string;
  title: string | null;
  zone_code: string | null;
  created_at: string;
  updated_at: string;
  edit_count: number;
  flag_count: number;
}

export interface ReportListResponse {
  items: ReportListItem[];
  page: number;
  page_size: number;
  total: number;
  has_next: boolean;
}
