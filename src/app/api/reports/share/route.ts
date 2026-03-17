import { NextRequest, NextResponse } from "next/server";
// TODO: Re-enable auth when sign-in is restored

const API_URL = process.env.API_URL;

/** POST /api/reports/share — Create a shareable report link */
export async function POST(request: NextRequest) {
  if (!API_URL) {
    return NextResponse.json({ error: "API URL not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const res = await fetch(`${API_URL}/reports/share`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer anonymous`,
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
  if (!API_URL) {
    return NextResponse.json({ error: "API URL not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(`${API_URL}/reports/mine`, {
      headers: { Authorization: `Bearer anonymous` },
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
