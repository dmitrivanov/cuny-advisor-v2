import type { ComponentPropsWithRef } from "react";

type Appearance = { variant?: "primary" | "secondary"; className?: string };
export type GlassButtonProps = Appearance & (
  | ({ as: "a" } & ComponentPropsWithRef<"a">)
  | ({ as?: "button" } & ComponentPropsWithRef<"button">)
);

/** Native links navigate; native buttons perform actions. No simulated controls. */
export function GlassButton(props: GlassButtonProps) {
  if (props.as === "a") {
    const { as: Element, variant = "primary", className = "", ...attributes } = props;
    return <Element className={`glass-button glass-button--${variant} ${className}`} {...attributes} />;
  }
  const { as: Element = "button", variant = "primary", className = "", type = "button", ...attributes } = props;
  return <Element type={type} className={`glass-button glass-button--${variant} ${className}`} {...attributes} />;
}
