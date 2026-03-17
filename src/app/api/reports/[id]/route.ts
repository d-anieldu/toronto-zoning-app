import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase-server";
import { isEditable } from "@/lib/editable-fields";
import type { PatchReportRequest, UserEdits, SectionNotes } from "@/types/reports";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** GET /api/reports/[id] — Fetch a single report with full data */
export async function GET(_request: NextRequest, context: RouteContext) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const user = auth;

  const { id } = await context.params;

  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("user_reports")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

/** PATCH /api/reports/[id] — Partial update (edits, notes, title) */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const user = auth;

  const { id } = await context.params;
  const body = (await request.json()) as PatchReportRequest;

  const supabase = await createServerSupabase();

  // ── Optimistic concurrency check ──
  if (body.if_updated_at) {
    const { data: current } = await supabase
      .from("user_reports")
      .select("updated_at")
      .eq("id", id)
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .single();

    if (!current) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (current.updated_at !== body.if_updated_at) {
      return NextResponse.json(
        { error: "Conflict", updated_at: current.updated_at },
        { status: 409 }
      );
    }
  }

  // ── Fetch existing row for merge ──
  const { data: existing, error: fetchErr } = await supabase
    .from("user_reports")
    .select("user_edits, section_notes")
    .eq("id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();

  if (fetchErr || !existing) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: Record<string, any> = {};

  // Title
  if (body.title !== undefined) {
    updates.title = body.title;
  }

  // Merge user_edits — upsert new keys, validate against whitelist
  if (body.user_edits || body.remove_edit_paths) {
    const merged: UserEdits = { ...(existing.user_edits as UserEdits || {}) };

    if (body.user_edits) {
      for (const [path, edit] of Object.entries(body.user_edits)) {
        if (!isEditable(path)) {
          return NextResponse.json(
            { error: `Field not editable: ${path}` },
            { status: 400 }
          );
        }
        merged[path] = edit;
      }
    }

    // Remove keys listed in remove_edit_paths
    if (body.remove_edit_paths) {
      for (const path of body.remove_edit_paths) {
        delete merged[path];
      }
    }

    updates.user_edits = merged;
  }

  // Merge section_notes by key
  if (body.section_notes) {
    const mergedNotes: SectionNotes = {
      ...(existing.section_notes as SectionNotes || {}),
      ...body.section_notes,
    };
    // Remove keys with empty string values
    for (const [key, val] of Object.entries(mergedNotes)) {
      if (val === "") delete mergedNotes[key];
    }
    updates.section_notes = mergedNotes;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }

  const { data: updated, error: updateErr } = await supabase
    .from("user_reports")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .select("*")
    .single();

  if (updateErr || !updated) {
    return NextResponse.json(
      { error: updateErr?.message || "Update failed" },
      { status: 500 }
    );
  }

  return NextResponse.json(updated);
}

/** DELETE /api/reports/[id] — Soft-delete a report */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const user = auth;

  const { id } = await context.params;

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("user_reports")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
