import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Phase 01A deliberately permits loopback HTTP only; this is not a general proxy.
function backendHealthUrl(): URL {
  const base = new URL(process.env.API_BASE_URL ?? "http://127.0.0.1:8000");
  if (base.protocol !== "http:" || !["localhost", "127.0.0.1", "[::1]"].includes(base.hostname)
      || base.username || base.password || base.pathname !== "/" || base.search || base.hash) {
    throw new Error("API_BASE_URL must be a local HTTP origin");
  }
  return new URL("/api/v1/health", base);
}

export async function GET() {
  try {
    const response = await fetch(backendHealthUrl(), {
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(4000),
    });
    const health: unknown = await response.json();
    if (!response.ok || typeof health !== "object" || health === null
        || !("status" in health) || health.status !== "ok"
        || !("service" in health) || health.service !== "cuny-advisor-v2-api") {
      throw new Error("Unexpected health response");
    }
    return NextResponse.json({ status: "ok", service: "cuny-advisor-v2-api" }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ status: "unavailable" }, {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
