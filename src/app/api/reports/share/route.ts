import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

const API_URL = process.env.API_URL;

/** POST /api/reports/share — Create a shareable report link */
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  if (!API_URL) {
    return NextResponse.json({ error: "API URL not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const res = await fetch(`${API_URL}/reports/share`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${auth.id}`,
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
    console.error("Share report error:", error);
    return NextResponse.json({ error: "Failed to share report" }, { status: 502 });
  }
}

/** GET /api/reports/share — List my shared reports */
export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  if (!API_URL) {
    return NextResponse.json({ error: "API URL not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(`${API_URL}/reports/mine`, {
      headers: { Authorization: `Bearer ${auth.id}` },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Backend error" }));
      return NextResponse.json(err, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("List shared reports error:", error);
    return NextResponse.json({ error: "Failed to list reports" }, { status: 502 });
  }
}
