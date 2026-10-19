import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

// No browser/framework dependency: guard the palette against contrast regressions.
const css = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8") + readFileSync(new URL("../src/components/explorer/explorer.css", import.meta.url), "utf8");
const colors = Object.fromEntries([...css.matchAll(/--([\w-]+):\s*(#[\da-f]{6});/gi)]
  .map(([, name, hex]) => [name, hex]));

function luminance(token) {
  assert.ok(colors[token], `Missing opaque color token: ${token}`);
  const rgb = colors[token].slice(1).match(/../g).map((hex) => parseInt(hex, 16) / 255);
  const linear = rgb.map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}

function contrast(foreground, background) {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

// Endpoints bound the pale canvas gradients and white translucent surfaces.
const surfaces = ["surface-solid", "surface-soft", "surface-lavender", "canvas", "ivory", "wash-blue", "wash-lavender"];
for (const foreground of ["ink", "muted", "brand", "accent", "success", "warning"]) {
  test(`${foreground}: normal text meets 4.5:1 across the light palette`, () => {
    for (const background of surfaces) {
      const ratio = contrast(foreground, background);
      assert.ok(ratio >= 4.5, `${foreground} on ${background}: ${ratio.toFixed(2)}:1`);
    }
  });
}
for (const background of ["brand", "brand-hover"]) {
  test(`Primary button label on ${background} meets 4.5:1`, () => {
    assert.ok(contrast("on-brand", background) >= 4.5);
  });
}
test("Keyboard focus ring meets 3:1 against every light surface", () => {
  for (const background of surfaces) assert.ok(contrast("focus", background) >= 3);
});

for (const foreground of ["night-ink", "night-muted", "night-accent"]) {
  test(`${foreground}: readable against the dark campus surfaces`, () => {
    for (const background of ["night", "night-panel"]) assert.ok(contrast(foreground, background) >= 4.5);
  });
}
test("Campus action text and focus remain legible", () => {
  assert.ok(contrast("night", "night-accent") >= 4.5);
  assert.ok(contrast("night-accent", "night-panel") >= 3);
});

for (const foreground of ["explorer-ink", "explorer-muted", "explorer-accent"]) {
  test(`${foreground}: normal text meets 4.5:1 on explorer surfaces`, () => {
    for (const background of ["surface-solid", "explorer-tint"]) assert.ok(contrast(foreground, background) >= 4.5);
  });
}
