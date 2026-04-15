import { NextRequest, NextResponse } from "next/server";

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
    const { address, asking_price } = body;

    if (!address || typeof address !== "string") {
      return NextResponse.json(
        { detail: "Address is required" },
        { status: 400 }
      );
    }

    const res = await fetch(`${API_URL}/generate-deck`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address,
        asking_price: typeof asking_price === "number" ? asking_price : 0,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Backend error" }));
      return NextResponse.json(
        { detail: err.detail || err.error || `Backend returned ${res.status}` },
        { status: res.status }
      );
    }

    const blob = await res.arrayBuffer();
    const slug = address
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    return new NextResponse(blob, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="deck-${slug}.pptx"`,
      },
    });
  } catch (error) {
    console.error("Generate deck API error:", error);
    return NextResponse.json(
      { detail: "Failed to generate investor deck" },
      { status: 502 }
    );
  }
}
