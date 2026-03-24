import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  if (!API_URL) {
    return NextResponse.json({ detail: "API URL not configured" }, { status: 500 });
  }

  const { key } = await params;
  const { searchParams } = new URL(request.url);
  const lon = searchParams.get("lon");
  const lat = searchParams.get("lat");
  const radius = searchParams.get("radius") || "0.005";

  if (!lon || !lat) {
    return NextResponse.json({ detail: "lon and lat are required" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `${API_URL}/map/layers/${key}?lon=${lon}&lat=${lat}&radius=${radius}`
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Backend error" }));
      return NextResponse.json(err, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=86400" },
    });
  } catch (error) {
    console.error(`Map layer ${key} error:`, error);
    return NextResponse.json({ detail: "Backend unreachable" }, { status: 502 });
  }
}
