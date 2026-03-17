import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase-server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** GET /api/reports/[id]/flags — List flags submitted for this report */
export async function GET(_request: NextRequest, context: RouteContext) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const user = auth;

  const { id } = await context.params;

  const supabase = await createServerSupabase();

  // Verify the report belongs to the authenticated user
  const { data: report, error: reportErr } = await supabase
    .from("user_reports")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();

  if (reportErr || !report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  // Fetch flags for this report
  const { data: flags, error: flagsErr } = await supabase
    .from("feedback_reports")
    .select(
      "id, status, field_path, field_label, tab_name, current_value, suggested_value, reason, source_url, created_at"
    )
    .eq("report_id", id)
    .order("created_at", { ascending: false });

  if (flagsErr) {
    return NextResponse.json(
      { error: "Failed to fetch flags" },
      { status: 500 }
    );
  }

  return NextResponse.json({ flags: flags ?? [] });
}
