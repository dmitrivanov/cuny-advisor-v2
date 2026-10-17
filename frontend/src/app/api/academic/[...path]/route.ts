import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
async function forward(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const valid =
    (path.length === 1 && path[0] === "releases" && request.method === "GET") ||
    ((path.length === 6 || path.length === 7) &&
      path[0] === "campuses" &&
      path[2] === "programs" &&
      path[4] === "releases" &&
      [path[1], path[3], path[5]].every((id) =>
        /^[A-Za-z0-9_:.-]{1,160}$/.test(id),
      ) &&
      (path.length === 6
        ? request.method === "GET"
        : path[6] === "preview" && request.method === "POST"));
  if (!valid)
    return NextResponse.json(
      { detail: "Unsupported academic route" },
      { status: 404 },
    );
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
      throw new Error("Invalid local origin");
    const url = new URL(
      `/api/v1/academic/${path.map(encodeURIComponent).join("/")}`,
      origin,
    );
    const search = new URL(request.url).searchParams;
    for (const name of ["campus_id", "program_id"])
      if (search.has(name)) url.searchParams.set(name, search.get(name)!);
    const body = request.method === "POST" ? await request.text() : undefined;
    if (body && body.length > 64000)
      return NextResponse.json(
        { detail: "Request too large" },
        { status: 413 },
      );
    const upstream = await fetch(url, {
      method: request.method,
      body,
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(10000),
    });
    const data: unknown = await upstream.json();
    return NextResponse.json(
      upstream.ok ? data : { detail: "Academic request failed" },
      {
        status: [200, 404, 422, 503].includes(upstream.status)
          ? upstream.status
          : 503,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch {
    return NextResponse.json(
      { detail: "Local academic service unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
export const GET = forward;
export const POST = forward;
