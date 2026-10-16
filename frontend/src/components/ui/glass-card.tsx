import type { GlassSurfaceProps } from "./glass-panel";

/** Static content container; never implies clickability or a working service. */
export function GlassCard({ as: Element = "article", className = "", ...props }: GlassSurfaceProps) {
  return <Element className={`glass-card rounded-card p-6 ${className}`} {...props} />;
}
