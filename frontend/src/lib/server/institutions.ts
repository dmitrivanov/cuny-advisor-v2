import { decodeRegistry } from "@/lib/advising/campuses";
export async function institutionalPayload() {
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
    throw new Error("Local registry origin required");
  const response = await fetch(new URL("/api/v1/institutions", base), {
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error("Registry unavailable");
  const text = await response.text();
  if (text.length > 150000) throw new Error("Registry too large");
  const payload: unknown = JSON.parse(text);
  decodeRegistry(payload);
  return payload;
}
