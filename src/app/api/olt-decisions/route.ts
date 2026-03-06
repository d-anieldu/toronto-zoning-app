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
    const address = searchParams.get("address") || "";
    const ward = searchParams.get("ward") || "";

    const params = new URLSearchParams();
    if (address) params.set("address", address);
    if (ward) params.set("ward", ward);

    const res = await fetch(`${API_URL}/olt-decisions?${params.toString()}`, {
      method: "GET",
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Backend error" }));
      return NextResponse.json(err, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("OLT decisions API error:", error);
    return NextResponse.json({ error: "Failed to fetch OLT decisions" }, { status: 502 });
  }
}
