import { AcademicIcon } from "@/components/academic-icon";
import { ConnectivityStatus } from "@/components/connectivity-status";
import { SiteHeader } from "@/components/site-header";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassPanel } from "@/components/ui/glass-panel";

const previews = [
  { icon: "book", title: "Understand your requirements", description: "A clearer view of what your program asks of you, with sources you can trace.", category: "Degree progress" },
  { icon: "compass", title: "Explore your next steps", description: "Space to consider your options alongside your goals, schedule, and responsibilities.", category: "Thoughtful planning" },
  { icon: "conversation", title: "Prepare for a conversation", description: "Bring your questions and context together for a more useful meeting with an advisor.", category: "Human guidance" },
] as const;

export default function Home() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="page-container pb-12 pt-10 sm:pt-14">
        <div className="mb-10 flex flex-wrap items-center gap-3 text-sm text-muted">
          <span className="preview-label"><span className="size-1.5 rounded-full bg-brand" aria-hidden="true" />Design preview · Phase 01B</span>
          <span>Starting with BMCC</span>
        </div>
        <section className="grid items-center gap-10 pb-12 lg:grid-cols-2 lg:gap-12 lg:pb-16" aria-labelledby="hero-title">
          <div>
            <p className="eyebrow mb-5">Your journey. A little more clarity.</p>
            <h1 id="hero-title" className="text-display font-semibold">A clearer path.<br /><span className="font-editorial font-normal italic text-brand">A confident next step.</span></h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">College comes with questions. We’re building a calmer place to explore your options, understand your path, and prepare for what comes next.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <GlassButton as="a" href="#approach">Explore the approach<AcademicIcon name="arrow" className="size-4" /></GlassButton>
              <GlassButton as="a" href="#project-status" variant="secondary">About this preview</GlassButton>
            </div>
            <p className="mt-5 text-sm text-muted">Built with care. Guided by academic evidence.</p>
          </div>
          <GlassPanel aria-labelledby="principles-title" className="relative">
            <div className="mb-8 flex items-center justify-between gap-4">
              <span className="icon-tile"><AcademicIcon name="compass" className="size-6" /></span>
              <span className="preview-label">Our guiding principles</span>
            </div>
            <p className="eyebrow mb-3">A more considered approach</p>
            <h2 id="principles-title" className="text-2xl font-semibold tracking-tight sm:text-3xl">An academic path.<br />A human perspective.</h2>
            <ol className="mt-7 space-y-5">
              {[
                ["Clarity before complexity", "Understand the why behind a next step."],
                ["Your life, in the picture", "Make room for goals and everyday realities."],
                ["People at the center", "Support conversations with human advisors."],
              ].map(([title, description], index) => (
                <li key={title} className="flex gap-4">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-soft text-xs font-semibold text-brand" aria-hidden="true">0{index + 1}</span>
                  <div><h3 className="text-sm font-semibold">{title}</h3><p className="mt-1 text-sm text-muted">{description}</p></div>
                </li>
              ))}
            </ol>
            <p className="mt-8 border-t border-line pt-4 text-xs leading-relaxed text-muted">A statement of intent. Advising services are not available in this preview.</p>
          </GlassPanel>
        </section>

        <aside id="project-status" aria-labelledby="project-status-title" className="mb-14 flex flex-col gap-4 rounded-card border border-line bg-soft p-6 sm:flex-row sm:gap-5">
          <AcademicIcon name="shield" className="size-6 shrink-0 text-brand" />
          <div>
            <h2 id="project-status-title" className="font-semibold">A preview, with clear boundaries</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">This independent project is in development and does not represent institutional approval by CUNY or BMCC. No student information is collected here. Academic advising, accounts, and student workspaces are not available yet.</p>
          </div>
        </aside>

        <section id="approach" aria-labelledby="approach-title">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div><p className="eyebrow mb-2">Looking ahead</p><h2 id="approach-title" className="text-2xl font-semibold tracking-tight sm:text-3xl">Less guesswork. More perspective.</h2></div>
            <p className="text-sm text-muted">Planned capabilities · Static previews</p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {previews.map((preview) => (
              <GlassCard key={preview.title} className="flex flex-col items-start">
                <span className="icon-tile mb-6"><AcademicIcon name={preview.icon} className="size-6" /></span>
                <p className="eyebrow mb-2">{preview.category}</p>
                <h3 className="text-lg font-semibold tracking-tight">{preview.title}</h3>
                <p className="mt-3 grow text-sm leading-7 text-muted">{preview.description}</p>
                <p className="mt-6 w-full border-t border-line pt-4 text-xs font-medium text-muted">Planned · Not available yet</p>
              </GlassCard>
            ))}
          </div>
        </section>

        <div className="mt-14 grid items-start gap-8 lg:grid-cols-2">
          <section aria-labelledby="foundation-title" className="py-3">
            <p className="eyebrow mb-3">A thoughtful foundation</p>
            <h2 id="foundation-title" className="text-2xl font-semibold tracking-tight">Trust starts with the details.</h2>
            <p className="mt-4 max-w-lg leading-7 text-muted">A clear distinction between what is known, what is planned, and what still needs a human conversation. That’s the foundation we’re working toward.</p>
            <p className="mt-4 text-sm text-muted">For now, this local preview checks the connection between the website and its API.</p>
          </section>
          <ConnectivityStatus />
        </div>
      </main>
      <footer className="page-container flex flex-wrap items-center justify-between gap-3 border-t border-line py-7 text-xs text-muted">
        <p>CUNY Advisor V2 · Independent project</p><p>English-language local preview · Starting with BMCC</p>
      </footer>
    </div>
  );
}
