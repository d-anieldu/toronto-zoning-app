import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

const API_URL = process.env.API_URL;

/**
 * Admin: trigger data ingestion from all sources
 */
export async function POST(request: NextRequest) {
  const result = await requireAdmin();
  if (result instanceof Response) return result;
  if (!API_URL) return NextResponse.json({ detail: "API URL not configured" }, { status: 500 });

  const sp = request.nextUrl.searchParams;
  const limit = sp.get("limit") || "500";

  try {
    const res = await fetch(`${API_URL}/intel/admin/ingest?limit=${limit}`, {
      method: "POST",
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Admin ingest error:", error);
    return NextResponse.json({ detail: "Ingestion failed" }, { status: 502 });
  }
}
