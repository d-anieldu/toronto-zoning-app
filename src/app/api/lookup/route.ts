import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const API_URL = process.env.API_URL;

export async function POST(request: NextRequest) {
  // Verify the user is authenticated
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  if (!API_URL) {
    return NextResponse.json(
      { detail: "API URL not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { address } = body;

    if (!address || typeof address !== "string") {
      return NextResponse.json(
        { detail: "Address is required" },
        { status: 400 }
      );
    }

    // Forward the request to the Railway backend
    const res = await fetch(`${API_URL}/lookup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
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
