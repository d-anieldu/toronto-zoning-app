import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Admin: publish an article
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireAdmin();
  if (result instanceof Response) return result;
  if (!API_URL) return NextResponse.json({ detail: "API URL not configured" }, { status: 500 });

  const { id } = await params;

  try {
    const res = await fetch(`${API_URL}/intel/admin/articles/${id}/publish`, {
      method: "POST",
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Admin publish error:", error);
    return NextResponse.json({ detail: "Failed to publish article" }, { status: 502 });
  }
}
