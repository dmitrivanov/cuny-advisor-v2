import type { SVGProps } from "react";

type IconName = "book" | "compass" | "conversation" | "arrow" | "shield";
type AcademicIconProps = SVGProps<SVGSVGElement> & { name: IconName };

export function AcademicIcon({ name, ...props }: AcademicIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...props}>
      {name === "book" && <><path d="M3 5c3-1 6-.5 9 1.5C15 4.5 18 4 21 5v14c-3-1-6-.5-9 1.5C9 18.5 6 18 3 19Z" /><path d="M12 6.5v14" /></>}
      {name === "compass" && <><circle cx="12" cy="12" r="9" /><path d="m16 8-2.5 5.5L8 16l2.5-5.5Z" /></>}
      {name === "conversation" && <><path d="M20 15a3 3 0 0 1-3 3H9l-5 3V6a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3Z" /><path d="M8 8h8M8 12h5" /></>}
      {name === "arrow" && <path d="M5 12h14m-5-5 5 5-5 5" />}
      {name === "shield" && <><path d="m12 3 8 3v5c0 5-4 8-8 10-4-2-8-5-8-10V6Z" /><path d="m8 12 3 3 5-6" /></>}
    </svg>
  );
}
