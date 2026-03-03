import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Admin: trigger AI content generation
 */
export async function POST(request: NextRequest) {
  const result = await requireAdmin();
  if (result instanceof Response) return result;
  if (!API_URL) return NextResponse.json({ detail: "API URL not configured" }, { status: 500 });

  const body = await request.json();

  try {
    const res = await fetch(`${API_URL}/intel/admin/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Admin generate error:", error);
    return NextResponse.json({ detail: "Generation failed" }, { status: 502 });
  }
}
