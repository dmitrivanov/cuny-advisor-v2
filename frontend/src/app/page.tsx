import Link from "next/link";
import { ConnectivityStatus } from "@/components/connectivity-status";

export default function Home() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-6">
          <Link href="/" className="text-lg font-bold tracking-tight">CUNY Advisor <span className="text-blue-700">V2</span></Link>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Local preview · Phase 01A</span>
        </div>
      </header>
      <main id="main-content" className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
        <p className="mb-4 text-sm font-semibold tracking-wide text-blue-700">STARTING WITH BMCC</p>
        <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-6xl">A clearer path through your academic journey.</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">We’re building a place to understand degree requirements, explore your options, and prepare for conversations with an advisor.</p>
        <div className="mt-12 grid gap-6 md:grid-cols-[1.2fr_1fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-7" aria-labelledby="preview-title">
            <h2 id="preview-title" className="text-xl font-bold">The foundation comes first</h2>
            <p className="mt-3 leading-7 text-slate-600">This preview checks that the website and its local API can communicate. Advising tools and student workspaces are planned for later phases.</p>
            <p className="mt-5 rounded-lg bg-blue-50 p-4 text-sm leading-6 text-blue-900">No student information is collected in this preview. Academic advising is not available yet.</p>
          </section>
          <ConnectivityStatus />
        </div>
        <p className="mt-10 max-w-2xl text-sm leading-6 text-slate-500">An independent project in development. This preview does not represent institutional approval by CUNY or BMCC.</p>
      </main>
      <footer className="mx-auto max-w-5xl border-t border-slate-200 px-6 py-6 text-sm text-slate-500">CUNY Advisor V2 · English-language local preview</footer>
    </div>
  );
}
