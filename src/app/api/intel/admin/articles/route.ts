import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

const API_URL = process.env.API_URL;

/**
 * Admin: list all articles (any status), get stats
 * Admin: create manually (unused for now)
 */
export async function GET(request: NextRequest) {
  const result = await requireAdmin();
  if (result instanceof Response) return result;
  if (!API_URL) return NextResponse.json({ detail: "API URL not configured" }, { status: 500 });

  const sp = request.nextUrl.searchParams;
  const params = new URLSearchParams();
  for (const key of ["article_type", "status", "limit", "offset"]) {
    const val = sp.get(key);
    if (val) params.set(key, val);
  }

  try {
    const res = await fetch(`${API_URL}/intel/admin/articles?${params}`);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Admin articles error:", error);
    return NextResponse.json({ detail: "Failed to fetch articles" }, { status: 502 });
  }
}
