import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const API_URL = process.env.API_URL;

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { found: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  if (!API_URL) {
    return NextResponse.json(
      { found: false, error: "API URL not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { type, id, zone_code } = body;

    if (!type || !id) {
      return NextResponse.json(
        { found: false, error: "type and id are required" },
        { status: 400 }
      );
    }

    const res = await fetch(`${API_URL}/reference`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, id, zone_code: zone_code || "" }),
    });

    if (!res.ok) {
      return NextResponse.json({ found: false }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Reference API error:", error);
    return NextResponse.json({ found: false }, { status: 500 });
  }
}
