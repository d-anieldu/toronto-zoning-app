import { NextRequest, NextResponse } from "next/server";
// TODO: Re-enable auth when sign-in is restored
// import { auth } from "@clerk/nextjs/server";

const API_URL = process.env.API_URL;

/** POST /api/reports/save — Save a report to user history */
export async function POST(request: NextRequest) {
  if (!API_URL) {
    return NextResponse.json({ error: "API URL not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const res = await fetch(`${API_URL}/reports/save`, {
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
    console.error("Save report error:", error);
    return NextResponse.json({ error: "Failed to save report" }, { status: 502 });
  }
}

/** GET /api/reports/save — List saved reports */
export async function GET(request: NextRequest) {
  if (!API_URL) {
    return NextResponse.json({ error: "API URL not configured" }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") || "50";

    const res = await fetch(`${API_URL}/reports/saved?limit=${limit}`, {
      headers: { Authorization: `Bearer anonymous` },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Backend error" }));
      return NextResponse.json(err, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("List saved reports error:", error);
    return NextResponse.json({ error: "Failed to list saved reports" }, { status: 502 });
  }
}
