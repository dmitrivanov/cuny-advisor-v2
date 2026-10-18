import Link from "next/link";
import { notFound } from "next/navigation";
import { decodeRegistry } from "@/lib/advising/campuses";
import { institutionalPayload } from "@/lib/server/institutions";
import { Workspace } from "@/components/workspace/workspace";
export default async function CampusPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let campuses;
  try {
    campuses = decodeRegistry(await institutionalPayload());
  } catch {
    return (
      <main className="page-container py-16">
        <h1 className="text-2xl font-semibold">
          Institution registry unavailable
        </h1>
        <p className="my-6">
          Check local V2 database migrations and the explicit registry import,
          then retry.
        </p>
        <Link href="/" className="source-link">
          Return to campus selection
        </Link>
      </main>
    );
  }
  const campus = campuses.find((c) => c.slug === slug && c.active);
  if (!campus) notFound();
  if (campus.assistantAvailability !== "pilot")
    return (
      <main className="page-container py-16">
        <h1 className="text-3xl font-semibold">{campus.name}</h1>
        <p className="my-6">
          Future assistant · Unavailable. No academic catalog or working
          assistant is available here.
        </p>
        <Link className="source-link" href="/">
          Return to campus selection
        </Link>
      </main>
    );
  return <Workspace campus={campus} />;
}
