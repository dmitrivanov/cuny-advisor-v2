import { NextResponse } from "next/server";
export async function forward(request: Request, path = "") {
  const headers = { "Cache-Control": "no-store" };
  try {
    if (
      !["localhost", "127.0.0.1", "[::1]"].includes(
        new URL(request.url).hostname,
      )
    )
      return NextResponse.json(
        { error: "Local origin required" },
        { status: 403, headers },
      );
    const base = new URL(process.env.API_BASE_URL ?? "http://127.0.0.1:8000");
    if (
      base.protocol !== "http:" ||
      !["localhost", "127.0.0.1", "[::1]"].includes(base.hostname) ||
      base.username ||
      base.password ||
      base.pathname !== "/" ||
      base.search ||
      base.hash
    )
      throw new Error();
    if (!["", "status", "session"].includes(path)) throw new Error();
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin)
      return NextResponse.json(
        { error: "Local origin required" },
        { status: 403, headers },
      );
    if ((path === "status") !== (request.method === "GET")) throw new Error();
    let body: string | undefined;
    if (request.method === "POST") {
      const reader = request.body?.getReader();
      let size = 0;
      const chunks: Uint8Array[] = [];
      if (reader)
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          size += value.length;
          if (size > 24000) {
            await reader.cancel();
            return NextResponse.json(
              { error: "Input too large" },
              { status: 413, headers },
            );
          }
          chunks.push(value);
        }
      const bytes = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.length;
      }
      body = new TextDecoder().decode(bytes);
    }
    const response = await fetch(
      new URL(`/api/v1/conversation${path ? `/${path}` : ""}`, base),
      {
        method: request.method,
        headers: { "Content-Type": "application/json" },
        body,
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(28000),
      },
    );
    if (!response.ok)
      return NextResponse.json(
        { error: "Conversation unavailable" },
        { status: response.status, headers },
      );
    const text = await response.text();
    if (text.length > 16000) throw new Error();
    return NextResponse.json(JSON.parse(text), { headers });
  } catch {
    return NextResponse.json(
      { error: "Conversation unavailable" },
      { status: 503, headers },
    );
  }
}
