import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Public: get a single published article by slug
 * GET /api/intel/articles/[slug]
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!API_URL) {
    return NextResponse.json({ detail: "API URL not configured" }, { status: 500 });
  }

  const { slug } = await params;

  try {
    const res = await fetch(`${API_URL}/intel/articles/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) {
      return NextResponse.json({ detail: "Article not found" }, { status: 404 });
    }
    const data = await res.json();
    // Only return published articles publicly
    if (data.status !== "published") {
      return NextResponse.json({ detail: "Article not found" }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error("Intel article fetch error:", error);
    return NextResponse.json({ detail: "Failed to fetch article" }, { status: 502 });
  }
}
