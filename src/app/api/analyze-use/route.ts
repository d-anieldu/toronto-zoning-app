import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!API_URL) {
    return NextResponse.json(
      { error: "API URL not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();

    // Determine which sub-endpoint to call based on the body
    let endpoint = "/analyze-use";
    if (body._action === "list") {
      endpoint = "/analyze-use/list";
    } else if (body._action === "all") {
      endpoint = "/analyze-use/all";
    } else if (body._action === "what-if") {
      endpoint = "/analyze-use/what-if";
    }

    // Remove the _action field before forwarding
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _action: _, ...payload } = body;

    const res = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Backend error" }));
      return NextResponse.json(
        { error: err.detail || `Backend returned ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Analyze-use API error:", error);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
