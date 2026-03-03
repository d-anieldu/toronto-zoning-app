import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Admin: get / update / delete a single article by ID
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireAdmin();
  if (result instanceof Response) return result;
  if (!API_URL) return NextResponse.json({ detail: "API URL not configured" }, { status: 500 });

  const { id } = await params;

  try {
    const res = await fetch(`${API_URL}/intel/admin/articles/${id}`);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Admin article get error:", error);
    return NextResponse.json({ detail: "Failed to fetch article" }, { status: 502 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireAdmin();
  if (result instanceof Response) return result;
  if (!API_URL) return NextResponse.json({ detail: "API URL not configured" }, { status: 500 });

  const { id } = await params;
  const body = await request.json();

  try {
    const res = await fetch(`${API_URL}/intel/admin/articles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Admin article update error:", error);
    return NextResponse.json({ detail: "Failed to update article" }, { status: 502 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireAdmin();
  if (result instanceof Response) return result;
  if (!API_URL) return NextResponse.json({ detail: "API URL not configured" }, { status: 500 });

  const { id } = await params;

  try {
    const res = await fetch(`${API_URL}/intel/admin/articles/${id}`, { method: "DELETE" });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Admin article delete error:", error);
    return NextResponse.json({ detail: "Failed to delete article" }, { status: 502 });
  }
}
