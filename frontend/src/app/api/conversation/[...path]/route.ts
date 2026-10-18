import { forward } from "@/lib/server/conversation-proxy";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ path: string[] }> };
export async function GET(request: Request, context: Context) {
  return forward(request, (await context.params).path.join("/"));
}
export async function POST(request: Request, context: Context) {
  return forward(request, (await context.params).path.join("/"));
}
