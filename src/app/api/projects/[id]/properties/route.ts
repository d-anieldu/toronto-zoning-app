import { NextRequest, NextResponse } from "next/server";
// TODO: Re-enable auth when sign-in is restored
// import { auth } from "@clerk/nextjs/server";

const API_URL = process.env.API_URL;

/** POST /api/projects/[id]/properties — Add property to project */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!API_URL) {
    return NextResponse.json({ error: "API URL not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const res = await fetch(`${API_URL}/projects/${id}/properties`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer anonymous`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Backend error" }));
      return NextResponse.json(err, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Add property error:", error);
    return NextResponse.json({ error: "Failed to add property" }, { status: 502 });
  }
}
