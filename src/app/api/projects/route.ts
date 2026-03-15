import { NextRequest, NextResponse } from "next/server";
// TODO: Re-enable auth when sign-in is restored
// import { auth } from "@clerk/nextjs/server";

const API_URL = process.env.API_URL;

/** POST /api/projects — Create a new project */
export async function POST(request: NextRequest) {
  if (!API_URL) {
    return NextResponse.json({ error: "API URL not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const res = await fetch(`${API_URL}/projects`, {
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
    console.error("Create project error:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 502 });
  }
}

/** GET /api/projects — List user's projects */
export async function GET() {
  if (!API_URL) {
    return NextResponse.json({ error: "API URL not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(`${API_URL}/projects`, {
      headers: { Authorization: `Bearer anonymous` },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Backend error" }));
      return NextResponse.json(err, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("List projects error:", error);
    return NextResponse.json({ error: "Failed to list projects" }, { status: 502 });
  }
}
