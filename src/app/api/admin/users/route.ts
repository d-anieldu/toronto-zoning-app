import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/auth";

/**
 * Admin-only: list all users with profile data and activity counts.
 * Uses the service-role key to access auth.users metadata (last_sign_in_at).
 */
export async function GET() {
  const result = await requireAdmin();
  if (result instanceof Response) return result;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Server config missing" }, { status: 500 });
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Fetch auth users (paginated — Supabase max 1000 per page)
  const { data: authData, error: authError } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 });
  }
  const authUsers = authData?.users ?? [];

  // Fetch all profiles
  const { data: profiles } = await admin.from("profiles").select("*");
  const profileMap = new Map((profiles ?? []).map((p: Record<string, unknown>) => [p.id, p]));

  // Aggregate report counts per user
  const { data: reportCounts } = await admin
    .from("user_reports")
    .select("user_id")
    .is("deleted_at", null);
  const reportCountMap = new Map<string, number>();
  for (const r of reportCounts ?? []) {
    reportCountMap.set(r.user_id, (reportCountMap.get(r.user_id) ?? 0) + 1);
  }

  // Aggregate feedback counts per user
  const { data: feedbackCounts } = await admin
    .from("feedback_reports")
    .select("user_id");
  const feedbackCountMap = new Map<string, number>();
  for (const f of feedbackCounts ?? []) {
    if (f.user_id) feedbackCountMap.set(f.user_id, (feedbackCountMap.get(f.user_id) ?? 0) + 1);
  }

  // Merge everything
  const users = authUsers.map((u) => {
    const profile = profileMap.get(u.id) as Record<string, unknown> | undefined;
    return {
      id: u.id,
      email: u.email,
      full_name: profile?.full_name || null,
      avatar_url: profile?.avatar_url || null,
      role: profile?.role || "user",
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at || null,
      email_confirmed_at: u.email_confirmed_at || null,
      provider: u.app_metadata?.provider || "email",
      report_count: reportCountMap.get(u.id) ?? 0,
      feedback_count: feedbackCountMap.get(u.id) ?? 0,
    };
  });

  // Sort by most recently created first
  users.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return NextResponse.json({
    users,
    total: users.length,
    stats: {
      total: users.length,
      confirmed: users.filter((u) => u.email_confirmed_at).length,
      admins: users.filter((u) => u.role === "admin").length,
      with_reports: users.filter((u) => u.report_count > 0).length,
    },
  });
}
