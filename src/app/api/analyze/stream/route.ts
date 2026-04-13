import { NextRequest } from "next/server";

const API_URL = process.env.API_URL;

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!API_URL) {
    return new Response("API URL not configured", { status: 500 });
  }

  const { searchParams } = request.nextUrl;
  const address = searchParams.get("address");
  const askingPrice = searchParams.get("asking_price") ?? "0";

  if (!address) {
    return new Response("address is required", { status: 400 });
  }

  const backendUrl = new URL(`${API_URL}/analyze/stream`);
  backendUrl.searchParams.set("address", address);
  backendUrl.searchParams.set("asking_price", askingPrice);

  const upstream = await fetch(backendUrl.toString(), {
    headers: { Accept: "text/event-stream" },
    // @ts-expect-error — Node fetch supports duplex
    duplex: "half",
  });

  if (!upstream.ok || !upstream.body) {
    return new Response("Pipeline unavailable", { status: 502 });
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
      Connection: "keep-alive",
    },
  });
}
