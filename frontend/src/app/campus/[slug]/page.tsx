import Link from "next/link";
import { notFound } from "next/navigation";
import { campusBySlug } from "@/lib/advising/campuses";
import { Workspace } from "@/components/workspace/workspace";
export default async function CampusPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const campus = campusBySlug(slug);
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
