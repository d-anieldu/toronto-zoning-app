import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const API_URL = process.env.API_URL;

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!API_URL) {
    return NextResponse.json({ error: "API URL not configured" }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const lon = searchParams.get("lon");
    const lat = searchParams.get("lat");
    const radius = searchParams.get("radius") || "500";

    if (!lon || !lat) {
      return NextResponse.json({ error: "lon and lat are required" }, { status: 400 });
    }

    const res = await fetch(
      `${API_URL}/nearby-activity?lon=${lon}&lat=${lat}&radius=${radius}`,
      { method: "GET" }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Backend error" }));
      return NextResponse.json(err, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Nearby activity API error:", error);
    return NextResponse.json({ error: "Failed to fetch nearby activity" }, { status: 502 });
  }
}
