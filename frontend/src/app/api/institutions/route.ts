import { NextResponse } from "next/server";
import { institutionalPayload } from "@/lib/server/institutions";
export const dynamic = "force-dynamic";
export async function GET() {
  const headers = { "Cache-Control": "no-store" };
  try {
    return NextResponse.json(await institutionalPayload(), { headers });
  } catch {
    return NextResponse.json(
      {
        error:
          "Institution registry unavailable. Check the local V2 database setup.",
      },
      { status: 503, headers },
    );
  }
}
