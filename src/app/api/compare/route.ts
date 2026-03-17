import { NextRequest, NextResponse } from "next/server";
// TODO: Re-enable auth when sign-in is restored

const API_URL = process.env.API_URL;

export async function POST(request: NextRequest) {
  if (!API_URL) {
    return NextResponse.json({ error: "API URL not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const res = await fetch(`${API_URL}/compare`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Backend error" }));
      return NextResponse.json(err, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Compare API error:", error);
    return NextResponse.json({ error: "Failed to compare properties" }, { status: 502 });
  }
}
