import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Public: list published articles
 * GET /api/intel/articles?article_type=weekly_brief&limit=20&offset=0
 */
export async function GET(request: NextRequest) {
  if (!API_URL) {
    return NextResponse.json({ detail: "API URL not configured" }, { status: 500 });
  }

  const sp = request.nextUrl.searchParams;
  const params = new URLSearchParams();
  // Forward allowed query params
  for (const key of ["article_type", "status", "limit", "offset"]) {
    const val = sp.get(key);
    if (val) params.set(key, val);
  }
  // Force published for public endpoint
  if (!params.has("status")) {
    params.set("status", "published");
  }

  try {
    const res = await fetch(`${API_URL}/intel/articles?${params}`, { next: { revalidate: 60 } });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Intel articles fetch error:", error);
    return NextResponse.json({ detail: "Failed to fetch articles" }, { status: 502 });
  }
}
