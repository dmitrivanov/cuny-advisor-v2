# Light Frosted Glass design system

Phase 01B, local frontend only. This is the visual foundation for an independent
academic advising project, not institutional branding or approval. No new student,
advisor, administrator, academic, or AI workflows are implemented in this phase.

## Philosophy

Quiet surfaces, precise hierarchy and generous space make complex information
approachable. Use pale ivory/blue canvas gradients, dark ink text, restrained indigo
accents and a small amount of frost. Editorial serif emphasis is limited to the
hero; practical system sans-serif carries navigation, data and body content.
No remote fonts, photos, decorative image library, animation library or added package.

The page's feature cards describe intentions only. They contain no invented student
records, academic outcomes, progress meters or controls implying an available service.
The prominent development notice states that advising/accounts/workspaces are not
available and no student information is collected. Retain independent-project and
non-institutional-approval language, English UI, existing favicon and noindex metadata.

## Token source and semantic palette

`frontend/src/app/globals.css` is the source of truth. `:root` owns semantic CSS
properties; Tailwind 4 `@theme inline` maps these into utility namespaces. Prefer
`text-ink`, `text-muted`, `text-brand`, `bg-soft`, `rounded-panel` and related tokens
over literal values in components. Decorative gradients stay in the stylesheet.

| CSS token | Value | Use |
| --- | --- | --- |
| `--canvas` | `#f8f9fc` | Page foundation |
| `--ivory` | `#fffdf8` | Warm gradient endpoint |
| `--ink` | `#202c46` | Titles and primary content |
| `--muted` | `#53617a` | Readable secondary content; never opacity-reduced text |
| `--brand` / `--brand-hover` | `#3448a5` / `#293b8c` | Links, solid primary actions, restrained emphasis |
| `--on-brand` | `#ffffff` | Solid primary action label |
| `--accent` | `#66529b` | Optional future lavender emphasis |
| `--success` / `--warning` | `#23634c` / `#80531d` | Connection indicators accompanied by text |
| `--surface-solid` | `#ffffff` | Fallback, buttons and dense future content |
| `--surface-soft` | `#eff3fc` | Notices, icon tiles and inset backgrounds |
| `--surface-lavender` | `#f2eef9` | Optional light accent surface |
| `--wash-blue` / `--wash-lavender` | `#e6edfc` / `#ece8f9` | Canvas gradient endpoints |
| `--border` | `#d5ddec` | Delicate structural separators, not an interactive-state signal |
| `--focus` | `#2546bb` | 3px visible keyboard outline with 4px offset |
| `--surface-glass` / `--surface-card` | white 78% / 88% | Enhanced surfaces over pale backgrounds only |

Palette checks cover ink/muted/brand/accent/status text against all opaque pale
endpoints at a minimum 4.5:1, primary labels at 4.5:1, and focus against surfaces
at 3:1. White compositing over these endpoints stays within that palette envelope.
Do not put these translucent panels over photography or saturated colors without
new contrast checks. Light borders are decorative: hierarchy, text, position and
visible focus convey meaning. This is not a full accessibility certification.

## Typography, spacing and effects

| Category | Scale / rule |
| --- | --- |
| Body font | Segoe UI → Helvetica Neue → Arial → sans-serif; no download |
| Editorial font | Iowan Old Style → Palatino Linotype → Book Antiqua → Georgia → serif |
| Hero | `text-display`: clamp 2.75–4.5rem, 1.08 line height, −0.045em tracking |
| Section / card headings | Tailwind `text-3xl` (1.875rem), `text-2xl` (1.5rem), `text-lg` (1.125rem) |
| Body / secondary | 1rem / 0.875rem; 1.6–1.75 line height; hero body 1.125rem |
| Labels | 0.75rem minimum, semibold; uppercase eyebrow only, not long sentences |
| Spacing | Tailwind's 0.25rem base scale; common 2, 3, 4, 5, 6, 8, 10, 12, 14, 16 units |
| Container | `--page-width` 75rem, `--page-gutter` clamp 1.25–3rem |
| Radii | `--ds-radius-control` 0.875rem, card 1.5rem, panel 2rem; badges circular |
| Shadows | `--ds-shadow-card` 6px/24px at 4%; glass 18px/60px at 7% plus pale inset edge |
| Blur | `--blur-glass` 12px desktop / 6px mobile; header 8px desktop / none mobile |
| Controls | `--size-control` 2.75rem minimum height (44px), icon tile 3rem |
| Feedback | 140ms background/border transition; no autoplay or movement |

Use the `--ds-*` source values through Tailwind's radius/shadow aliases. Do not add
unique blur, radius or shadow values to each panel. No nested backdrop blur: cards
use translucent backgrounds without another filter. Dense future tables and text
should use opaque surfaces, fewer effects and clear separators.

## Reusable components

- **GlassPanel** (`components/ui/glass-panel.tsx`): section by default; supports
  `as="div"`, `section`, `article`, or `aside` with normal HTML/ARIA attributes.
  Supply a heading and `aria-labelledby` when rendering a named section. Use for
  a principal grouping, not every nested wrapper. Padding 6 → 8 units at `sm`.
- **GlassCard**: article by default, same limited semantic `as` support and HTML
  attributes. Static informational content; no hover lift/cursor implying a link.
- **GlassButton**: discriminated native button (default) or `as="a"` anchor.
  Standard element-specific props and refs remain typed. Buttons default to
  `type="button"`; primary and secondary variants share focus, size and disabled
  rules. Native disabled is for buttons only; anchors must point to a real destination.
  Include visible action text. No invented disabled login/advising controls.
- **SiteHeader**: header HTML attributes, brand home link, named main navigation and
  first-focus skip link. Navigation points to existing sections and wraps on mobile;
  no hidden menu, expanded state or unnecessary client JavaScript.
- **AcademicIcon**: small original, currentColor, decorative SVGs with hidden/focusable
  attributes. Visible surrounding text communicates meaning. No external icon package.
- **ConnectivityStatus**: retains the Phase 01A hook, request cancellation, timeouts,
  endpoint, labels, descriptions and retry behavior. Only markup wrappers/styles
  change. Live status remains polite; dots have text equivalents. Health proxy untouched.

Use `className` for layout utilities without conflicting with a primitive's padding
or surface classes. Change tokens or add a deliberate variant when a shared primitive
needs a different visual treatment. Never turn a static content card into a button
through ARIA role alone. The hero principle list is a small static design demonstration;
there is no separate showcase route or fake dashboard.

## Progressive enhancement and accessibility

Opaque white panels and visible borders are the default. Only `@supports` activates
translucent surfaces and backdrop filtering. `prefers-reduced-transparency` requests
opaque surfaces where the browser supports that preference. Mobile header is opaque
and mobile panel blur is reduced. Forced-colors mode removes shadows/blur and uses
system borders/focus colors. There are no animated backgrounds or auto transitions.
`prefers-reduced-motion` disables transitions and animations globally and retains
normal anchor navigation (no smooth scrolling).

One h1, ordered headings, named landmarks, native controls, English `lang`, visible
status labels and a skip link support navigation. Main is programmatically focusable
for the skip link. Links and buttons have explicit keyboard focus and at least a
44px target height. Do not rely on status colors, frosted boundaries or icon shapes
alone. Review at zoom and with assistive technology before a future real-user release.

## Responsive behavior

- Around **375px**: 20px page gutters, wrapping header navigation, fluid hero text,
  stacked hero/card/status sections; no forced horizontal scrolling. Controls wrap.
- Around **768px**: wider gutters and three compact feature cards; hero and foundation
  remain stacked until `lg`. Every card grows vertically for its text.
- Around **1440px**: centered 75rem container, two-column hero and foundation/status,
  three feature cards, generous whitespace. Max width prevents overlong text lines.
- Tailwind breakpoints remain defaults: `sm` 640, `md` 768, `lg` 1024. Layout follows
  available width, not device identification. No fixed card heights or viewport text clipping.

## Future applications (not implemented)

Student workspaces can use a main panel with opaque academic evidence and clearly
separated provisional states. Advisor screens should favor dense readable review
surfaces, explicit provenance and decisions over more glass. Admin/governance views
should reuse the header/control vocabulary while prioritizing scoped permissions,
review status and audit history. Visual design must never substitute for authorization,
academic approval or a deterministic rule result. Those require separate authorization.

## Checks and manual review

Run from the repository root:

```sh
node --test frontend/scripts/design-contrast.test.mjs
npm --prefix frontend run lint
npm --prefix frontend run typecheck
NEXT_TELEMETRY_DISABLED=1 npm --prefix frontend run build
git diff --check
```

The nine Node built-in contrast tests add no testing framework and are included
in the existing frontend CI job (GitHub Actions has not been run in this session). They protect palette
choices rather than claiming to test all rendered content or browser behavior.
Use `cd frontend && npm run dev` and open the printed loopback URL. Review widths
375/768/1440px, tab from the skip link through anchors to Check again, verify focus,
use the approach/status links, and check readable notice/cards. With the existing
backend running observe Connected; stop only a backend you own and retry for
Unavailable. Verify reduce-motion and opaque fallbacks using browser accessibility
or rendering settings where supported. No change to the backend is necessary.

The five high-severity development lint-chain advisories and deprecated ESLint pin
recorded in [Phase 01A verification](PHASE_01A_VERIFICATION.md) are pre-existing debt.
No package versions, lockfile, advisory suppression or dependency remediation is
part of Phase 01B. Browser results are recorded below after actual checks.

## Actual Phase 01B verification

Local checks completed on the requested branch with the existing dependencies:

| Check | Result |
| --- | --- |
| `node --test frontend/scripts/design-contrast.test.mjs` | 9 passed, 0 failed |
| `npm --prefix frontend run lint` | Exit 0; no warnings/findings |
| `npm --prefix frontend run typecheck` | Exit 0; Next route types and TypeScript passed |
| `npm --prefix frontend run build` | Exit 0; static page/favicon and unchanged dynamic health route built |
| `git diff --check` | Exit 0 |
| Browser at 375 / 768 / 1440px | Layout inspected; document scroll width equals viewport at each size; no horizontal overflow |
| Browser computed surfaces | 32px panel radius, 12px desktop / 6px mobile panel blur, opaque mobile header confirmed |
| Keyboard | First Tab reveals skip link with 3px focus ring; Enter focuses main; hero link has 44px target and navigates to approach; keyboard reaches retry button |
| Connection behavior | Connected observed with temporary unchanged backend; keyboard retry worked; after backend stopped, retry displayed Unavailable with original guidance |
| Source boundary check | State/fetch/effect block identical to HEAD; health proxy, layout/noindex, dependencies/lockfile and backend unchanged |

The existing generated `next-env.d.ts` change was present before this phase and
was preserved after checks. No commits, pushes, PRs or deployment. Temporary servers
are stopped after verification; existing owner-run processes are not stopped.
Browser inspection used the local in-app browser; it is not a Safari/Firefox/device
matrix or a screen-reader audit. Reduced-motion/transparency and unsupported-filter
fallbacks were reviewed in CSS but not emulated in a separate engine/preferences
session. Manual accessibility and older-browser review remains before real-user use.


## Phase 03A contextual workspace application

Conversation home uses one centered frosted panel (maximum 52rem including gutters)
over the existing quiet gradient; compact branding replaces the portal-style
header. Academic tools use a wide focused outer panel with a mostly opaque card
grid, two columns from 768px and four from 1152px; below 768px columns stack.
The existing semantic palette, surface fallbacks, forced-colors and reduced-motion
rules are retained. No animated transitions or nested backdrop filters are added.

Course code/title hierarchy uses 15px/13px text, normal whole-word wrapping and
native checkbox/details controls with 44px interaction rows. All cards share one
border/padding/radius treatment. Selected cards add visible “Selected” text and a
subtle border/inset accent. Details are outside labels, so expansion cannot toggle
completion. Sparse requirement cards explicitly say unresolved rather than filling
missing data. No duplicate course heading/requirement row for a single same-code
group. Long identifiers are confined to on-demand reproducibility/evidence views.

Module headings receive focus on entry; return restores the invoking action or
chat heading. Dedicated views do not impose a modal focus trap. Full disclosure
remains keyboard-accessible in the footer; neither glass effects nor colors carry
academic meaning. See [Phase 03A screenshots/checks](PHASE_03A_VERIFICATION.md).
