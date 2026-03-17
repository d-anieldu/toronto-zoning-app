import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

const API_URL = process.env.API_URL;

/** POST /api/projects — Create a new project */
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const userId = auth.id;
  if (!API_URL) {
    return NextResponse.json({ error: "API URL not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const res = await fetch(`${API_URL}/projects`, {
      method: "POST",
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
    console.error("Create project error:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 502 });
  }
}

/** GET /api/projects — List user's projects */
export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const userId = auth.id;
  if (!API_URL) {
    return NextResponse.json({ error: "API URL not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(`${API_URL}/projects`, {
      headers: { Authorization: `Bearer ${userId}` },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Backend error" }));
      return NextResponse.json(err, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("List projects error:", error);
    return NextResponse.json({ error: "Failed to list projects" }, { status: 502 });
  }
}
