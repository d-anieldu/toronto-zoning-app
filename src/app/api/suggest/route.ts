import { NextRequest, NextResponse } from "next/server";
// TODO: Re-enable auth when sign-in is restored
// import { auth } from "@clerk/nextjs/server";

const API_URL = process.env.API_URL;

export async function POST(request: NextRequest) {
  if (!API_URL) {
    return NextResponse.json({ suggestions: [] }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { text } = body;

    if (!text || typeof text !== "string" || text.trim().length < 3) {
      return NextResponse.json({ suggestions: [] });
    }

    const res = await fetch(`${API_URL}/suggest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text.trim() }),
    });

    if (!res.ok) {
      return NextResponse.json({ suggestions: [] });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Suggest API error:", error);
    return NextResponse.json({ suggestions: [] });
  }
}
