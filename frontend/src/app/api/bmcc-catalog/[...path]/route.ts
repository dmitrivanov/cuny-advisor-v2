import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const id = (value: string) => /^[A-Za-z0-9_.:-]{1,160}$/.test(value);
  if (!(
    (path.length === 1 && path[0] === "snapshots") ||
    (path.length === 2 &&
      id(path[0]) &&
      ["departments", "programs", "courses", "sources"].includes(path[1])) ||
    (path.length === 3 && id(path[0]) && path[1] === "courses" && id(path[2]))
  ))
    return NextResponse.json(
      { detail: "Unsupported browsing route" },
      { status: 404 },
    );
  const headers = { "Cache-Control": "no-store" };
  try {
    const origin = new URL(process.env.API_BASE_URL ?? "http://127.0.0.1:8000");
    if (
      origin.protocol !== "http:" ||
      !["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname) ||
      origin.username ||
      origin.password ||
      origin.pathname !== "/" ||
      origin.search ||
      origin.hash
    )
      throw new Error();
    const url = new URL(
      `/api/v1/bmcc-catalog/${path.map(encodeURIComponent).join("/")}`,
      origin,
    );
    const query = new URL(request.url).searchParams;
    for (const key of ["q", "department", "offset", "limit"])
      if (query.has(key)) url.searchParams.set(key, query.get(key)!);
    const response = await fetch(url, {
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(10000),
    });
    const body = await response.text();
    if (body.length > 2000000) throw new Error();
    return NextResponse.json(
      response.ok ? JSON.parse(body) : { detail: "Browsing request failed" },
      {
        status: [200, 404, 422, 503].includes(response.status)
          ? response.status
          : 503,
        headers,
      },
    );
  } catch {
    return NextResponse.json(
      { detail: "Local BMCC browsing catalog unavailable" },
      { status: 503, headers },
    );
  }
}
