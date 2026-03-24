import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

const API_URL = process.env.API_URL;

export async function GET(request: NextRequest) {
  if (!API_URL) {
    return NextResponse.json({ detail: "API URL not configured" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const lon = searchParams.get("lon");
  const lat = searchParams.get("lat");
  const radius = searchParams.get("radius") || "0.002";

  if (!lon || !lat) {
    return NextResponse.json({ detail: "lon and lat are required" }, { status: 400 });
  }

  try {
    const res = await fetch(`${API_URL}/map/parcels?lon=${encodeURIComponent(lon)}&lat=${encodeURIComponent(lat)}&radius=${encodeURIComponent(radius)}`);
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
    console.error("Map parcels error:", error);
    return NextResponse.json({ detail: "Backend unreachable" }, { status: 502 });
  }
}
