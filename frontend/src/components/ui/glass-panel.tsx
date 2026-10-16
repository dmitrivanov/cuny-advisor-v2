import type { HTMLAttributes } from "react";

export type GlassSurfaceProps = HTMLAttributes<HTMLElement> & {
  as?: "div" | "section" | "article" | "aside";
};

/** Choose a semantic tag and supply a heading/accessible name for a section. */
export function GlassPanel({ as: Element = "section", className = "", ...props }: GlassSurfaceProps) {
  return <Element className={`glass-panel rounded-panel p-6 sm:p-8 ${className}`} {...props} />;
}
