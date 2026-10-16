import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";
import { AcademicIcon } from "./academic-icon";

type SiteHeaderProps = ComponentPropsWithoutRef<"header">;

export function SiteHeader({ className = "", ...props }: SiteHeaderProps) {
  return (
    <header className={`site-header ${className}`} {...props}>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <div className="page-container flex flex-wrap items-center justify-between gap-4 py-5">
        <Link href="/" className="flex items-center gap-3 rounded-control" aria-label="CUNY Advisor V2 home">
          <span className="brand-mark"><AcademicIcon name="book" className="size-6" /></span>
          <span className="text-lg font-semibold tracking-tight">CUNY Advisor <span className="text-brand">V2</span></span>
        </Link>
        <nav aria-label="Main navigation" className="flex flex-wrap items-center gap-2 text-sm font-medium sm:gap-4">
          <a className="nav-link" href="#approach">Our approach</a>
          <a className="nav-link" href="#project-status">Project status</a>
        </nav>
      </div>
    </header>
  );
}
