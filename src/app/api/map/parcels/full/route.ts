import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 120;

const API_URL = process.env.API_URL;

export async function GET(_request: NextRequest) {
  if (!API_URL) {
    return NextResponse.json({ detail: "API URL not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(`${API_URL}/map/parcels/full`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Backend error" }));
      return NextResponse.json(err, { status: res.status });
    }
    return new Response(res.body, {
      status: res.status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Map full parcels error:", error);
    return NextResponse.json({ detail: "Backend unreachable" }, { status: 502 });
  }
}
