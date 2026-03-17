import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase-server";
import type {
  CreateReportResponse,
  ReportListResponse,
} from "@/types/reports";

/** POST /api/reports — Create a new user report */
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const user = auth;

  const body = await request.json();
  const { address, lookup_data, title } = body;

  if (!address || !lookup_data) {
    return NextResponse.json(
      { error: "address and lookup_data are required" },
      { status: 400 }
    );
  }

  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("user_reports")
    .insert({
      user_id: user.id,
      address,
      lookup_data,
      title: title || address,
    })
    .select("id, address, title, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data as CreateReportResponse, { status: 201 });
}

/** GET /api/reports — List authenticated user's reports (paginated) */
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const user = auth;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("page_size") || "20", 10))
  );
  const offset = (page - 1) * pageSize;

  const supabase = await createServerSupabase();

  // Count total (non-deleted)
  const { count } = await supabase
    .from("user_reports")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("deleted_at", null);

  const total = count ?? 0;

  // Fetch page
  const { data: rows, error } = await supabase
    .from("user_reports")
    .select(
      "id, address, title, user_edits, lookup_data, created_at, updated_at"
    )
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Count flags per report in a single query
  const reportIds = (rows || []).map((r) => r.id);
  let flagCounts: Record<string, number> = {};

  if (reportIds.length > 0) {
    const { data: flags } = await supabase
      .from("feedback_reports")
      .select("report_id")
      .in("report_id", reportIds);

    if (flags) {
      for (const f of flags) {
        if (f.report_id) {
          flagCounts[f.report_id] = (flagCounts[f.report_id] || 0) + 1;
        }
      }
    }
  }

  const items = (rows || []).map((r) => {
    const ld = r.lookup_data as Record<string, any> | null;
    const zoneCode = ld?.effective_standards?.zone_code ?? ld?.effective_standards?.zone_label?.zone_code ?? null;
    return {
      id: r.id,
      address: r.address,
      title: r.title,
      zone_code: zoneCode,
      created_at: r.created_at,
      updated_at: r.updated_at,
      edit_count: r.user_edits ? Object.keys(r.user_edits).length : 0,
      flag_count: flagCounts[r.id] || 0,
    };
  });

  const response: ReportListResponse = {
    items,
    page,
    page_size: pageSize,
    total,
    has_next: offset + pageSize < total,
  };

  return NextResponse.json(response);
}
