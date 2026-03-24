import { NextResponse } from "next/server";

const API_URL = process.env.API_URL;

export async function GET() {
  if (!API_URL) {
    return NextResponse.json({ detail: "API URL not configured" }, { status: 500 });
  }
  try {
    const res = await fetch(`${API_URL}/map/metadata`);
    if (!res.ok) {
      return NextResponse.json({ detail: "Backend error" }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=86400" },
    });
  } catch (error) {
    console.error("Map metadata error:", error);
    return NextResponse.json({ detail: "Backend unreachable" }, { status: 502 });
  }
}
