import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Admin: browse ingested events
 */
export async function GET(request: NextRequest) {
  const result = await requireAdmin();
  if (result instanceof Response) return result;
  if (!API_URL) return NextResponse.json({ detail: "API URL not configured" }, { status: 500 });

  const sp = request.nextUrl.searchParams;
  const params = new URLSearchParams();
  for (const key of ["source", "event_type", "ward", "since", "until", "limit", "offset"]) {
    const val = sp.get(key);
    if (val) params.set(key, val);
  }

  try {
    const res = await fetch(`${API_URL}/intel/admin/events?${params}`);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Admin events error:", error);
    return NextResponse.json({ detail: "Failed to fetch events" }, { status: 502 });
  }
}
