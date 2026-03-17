import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

const API_URL = process.env.API_URL;

/** GET /api/projects/[id] — Get project with properties */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const userId = auth.id;
  if (!API_URL) {
    return NextResponse.json({ error: "API URL not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(`${API_URL}/projects/${id}`, {
      headers: { Authorization: `Bearer ${userId}` },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Backend error" }));
      return NextResponse.json(err, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Get project error:", error);
    return NextResponse.json({ error: "Failed to fetch project" }, { status: 502 });
  }
}

/** PATCH /api/projects/[id] — Update project */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const userId = authResult.id;
  if (!API_URL) {
    return NextResponse.json({ error: "API URL not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const res = await fetch(`${API_URL}/projects/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userId}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Backend error" }));
      return NextResponse.json(err, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Update project error:", error);
    return NextResponse.json({ error: "Failed to update project" }, { status: 502 });
  }
}

/** DELETE /api/projects/[id] — Delete project */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const delAuth = await requireAuth();
  if (delAuth instanceof NextResponse) return delAuth;
  const userId = delAuth.id;
  if (!API_URL) {
    return NextResponse.json({ error: "API URL not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(`${API_URL}/projects/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${userId}` },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Backend error" }));
      return NextResponse.json(err, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Delete project error:", error);
    return NextResponse.json({ error: "Failed to delete project" }, { status: 502 });
  }
}
