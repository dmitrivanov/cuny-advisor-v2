import { forward } from "@/lib/server/conversation-proxy";
export const dynamic = "force-dynamic";
export const POST = (request: Request) => forward(request);
