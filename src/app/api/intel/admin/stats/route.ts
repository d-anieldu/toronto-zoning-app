import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

const API_URL = process.env.API_URL;

/**
 * Admin: get dashboard stats
 */
export async function GET() {
  const result = await requireAdmin();
  if (result instanceof Response) return result;
  if (!API_URL) return NextResponse.json({ detail: "API URL not configured" }, { status: 500 });

  try {
    const res = await fetch(`${API_URL}/intel/admin/stats`);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ detail: "Failed to fetch stats" }, { status: 502 });
  }
}
