import { NextRequest, NextResponse } from "next/server";
// TODO: Re-enable auth when sign-in is restored

const API_URL = process.env.API_URL;

export async function POST(request: NextRequest) {
  if (!API_URL) {
    return NextResponse.json(
      { detail: "API URL not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { address, include_nearby, include_parcel, include_policy } = body;

    if (!address || typeof address !== "string") {
      return NextResponse.json(
        { detail: "Address is required" },
        { status: 400 }
      );
    }

    // Forward the full request to the Railway backend (preserving optional flags)
    const payload: Record<string, unknown> = { address };
    if (include_nearby !== undefined) payload.include_nearby = include_nearby;
    if (include_parcel !== undefined) payload.include_parcel = include_parcel;
    if (include_policy !== undefined) payload.include_policy = include_policy;

    const res = await fetch(`${API_URL}/lookup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Backend error" }));
      return NextResponse.json(
        { detail: err.detail || `Backend returned ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Lookup API error:", error);
    return NextResponse.json(
      { detail: "Failed to connect to zoning API" },
      { status: 502 }
    );
  }
}
