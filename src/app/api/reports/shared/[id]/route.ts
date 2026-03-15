import { NextRequest, NextResponse } from "next/server";
// TODO: Re-enable auth when sign-in is restored
// import { auth } from "@clerk/nextjs/server";

const API_URL = process.env.API_URL;

/** GET /api/reports/shared/[id] — Public access to shared report */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!API_URL) {
    return NextResponse.json({ error: "API URL not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(`${API_URL}/reports/shared/${id}`);

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Report not found" }));
      return NextResponse.json(err, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Get shared report error:", error);
    return NextResponse.json({ error: "Failed to fetch report" }, { status: 502 });
  }
}

/** DELETE /api/reports/shared/[id] — Delete shared report (owner only) */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!API_URL) {
    return NextResponse.json({ error: "API URL not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(`${API_URL}/reports/shared/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer anonymous` },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Backend error" }));
      return NextResponse.json(err, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Delete shared report error:", error);
    return NextResponse.json({ error: "Failed to delete report" }, { status: 502 });
  }
}
