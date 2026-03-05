import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function GET() {
  if (!API_URL) {
    return NextResponse.json({ detail: "API URL not configured" }, { status: 500 });
  }
  try {
    const res = await fetch(`${API_URL}/map/metadata`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Map metadata error:", error);
    return NextResponse.json({ detail: "Backend unreachable" }, { status: 502 });
  }
}
