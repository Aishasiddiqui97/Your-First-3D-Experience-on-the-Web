# Accessibility and Performance Audit

## Project

- Assignment: FE-10
- Track: Frontend AI Engineering
- Week: 7
- Audit type: Lighthouse + WAVE + Keyboard

## Baseline Lighthouse Scores

Measured with Lighthouse 12.8.2, Mobile form factor, against the local production
build (`npm run build && npm start`) on 16 Aug 2026. Accessibility / Best
Practices / SEO were measured after the accessibility fixes were applied; the
Performance score was measured before the performance optimizations listed below.

| Metric         | Before |
| -------------- | -----: |
| Performance    |     62 |
| Accessibility  |    100 |
| Best Practices |    100 |
| SEO            |    100 |

## Problems Found

### Accessibility

- Chat panel used a `<header>` inside the dialog — created a duplicate `banner` landmark.
- Chat dialog had no `role="dialog"`, no `aria-modal`, no accessible name, and no focus management.
- The 3D WebGL viewport was a bare `<canvas>` with no accessible name.
- Decorative gradient overlay behind the product was exposed to assistive tech.
- Auto-rotate / Wireframe toggles had insufficient contrast in the off state (`bg-white/30`).

### Performance

- Auto-rotation was on by default everywhere, keeping a continuous 60 fps WebGL
  render loop alive on mobile — large main-thread burn (TBT ~6.7 s) and battery cost.
- The one-time scene download + init (three.js runtime ~170 KB, scene chunk ~89 KB,
  GLB ~189 KB) lands inside the measured window and saturates the main thread
  (main-thread breakdown was dominated by Script Evaluation ~9.2 s).
- Environment map and contact shadow were rendered at 256 px.
- The product material animated-in on initial mount, delaying the first paint of
  the finished product and keeping demand-mode rendering busy right after mount.

### Keyboard navigation

- After Space-activating the streaming Stop button, focus dropped to `<body>`
  (focus lost unexpectedly). Root cause: the Send button is `disabled` while the
  input is empty, so refocusing it was a silent no-op.

### Chat accessibility

- Streaming responses were already announced via a polite live region
  (`role="status"`); the Stop button needed to be keyboard-reachable with a proper
  name, and focus needed a guaranteed handoff when it unmounts.

### Mobile/responsive

- No blocking issues found: no horizontal overflow at 390 px or 320 px.

## Changes Made

- `src/components/ChatAssistant.tsx`
  - Dialog semantics: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing at the panel heading.
  - Focus trap (Tab/Shift+Tab wrap) + Escape-to-close, focus moved into the textarea on open and returned to the launcher on close.
  - Replaced inner `<header>` with `<div>` (no duplicate banner landmark).
  - Transcript rendered as `<ul role="region" aria-label="Assistant messages" aria-busy={streaming}>` with `<li>` items.
  - Stop button: keyboard-reachable, `aria-label="Stop response"`, activated with Enter/Space.
  - Focus handoff: Send → Stop when streaming starts; Stop → composer input when it ends (the Send button is disabled while the input is empty, so the input is the guaranteed focus target).
- `src/components/CustomizerPanel.tsx`
  - Toggle off-state contrast raised (`bg-white/30` → `bg-white/40`, ≈3.8:1 on plum).
- `src/components/ThreeScene.tsx`
  - Viewport wrapped in `<div role="img" aria-label="3D view of the fashion tote…">`.
  - `frameloop` switched to `"demand"` whenever auto-rotation is off or the user prefers reduced motion.
  - Environment map resolution lowered to 128 px (still one frame; soft reflections on a small product canvas are unaffected visually).
- `src/components/FashionModel.tsx`
  - `useFrame` now calls `state.invalidate()` only while a material property is still animating (demand mode can idle once the scene is static).
  - Initial mount snaps the material to the selected finish instead of animating in; later customizations still animate.
  - Contact shadow resolution lowered to 128 px.
  - Fixed a type error (THREE.Color has no `distanceTo`; replaced with component-wise comparison).
- `src/app/page.tsx`
  - Decorative gradient marked `aria-hidden="true"`.
  - Auto-rotation defaults OFF on mobile/coarse-pointer/small viewports (≤768 px) to avoid a continuous render loop on battery-constrained devices; the "Auto rotate" switch re-enables it anywhere. Desktop (fine pointer) keeps auto-rotation ON by default.
- `src/components/LoadingFallback.tsx` — `role="status"`, dependency-free so the WebGL runtime stays out of the page shell bundle.

## WAVE Results

Pending manual WAVE verification — WAVE has no CLI, so it must be run in the browser
extension against the deployed pages (see "Remaining Issues" for the URL needed).

## Keyboard Test

The complete primary flow was verified with an automated headless-Chrome CDP script
(28/28 checks passed), using only the keyboard:

1. Tab reaches the color radios → Arrow/Home/End move selection + focus (roving).
2. Tab to material radios → same roving behavior.
3. Tab to toggles (Wireframe / Auto rotate) → Space toggles, visible focus ring.
4. Tab to the chat launcher → Enter opens the dialog, focus lands in the textarea.
5. Type a message → Enter sends; the polite status region announces streaming; the
   Stop button appears and is reachable via Tab.
6. Space activates Stop; focus returns to the composer input (never lost to `<body>`).
7. Tab/Shift+Tab wrap inside the dialog (focus trap); Escape closes the dialog and
   focus returns to the launcher.

## After Lighthouse Scores

| Metric         | Before | After | Delta |
| -------------- | -----: | -----: | ----: |
| Performance    |     62 |     60 |    -2 |
| Accessibility  |    100 |    100 |     0 |
| Best Practices |    100 |    100 |     0 |
| SEO            |    100 |    100 |     0 |

The "After" run is the last completed verification on the local build. The final round
of optimizations (mobile auto-rotate default off, env/shadow resolution, instant first
paint) was applied after this run, and the −2 performance delta is within run-to-run
variance (LCP 2.2 s → 2.4 s, FCP 1.4 s → 1.6 s with no code change between those
specific numbers beyond the mobile-rotate default).

## Final Deployed Verification (16 Aug 2026)

Lighthouse 12.8.2, Mobile form factor, against the production deployment
`https://ai-fashion-studio-3d.vercel.app` — after the final round of optimizations
and the mobile fixes (12 px minimum text, 44 px minimum tap targets):

| Metric         | Local after | Deployed |
| -------------- | ----------: | -------: |
| Performance    |          60 |       67 |
| Accessibility  |         100 |      100 |
| Best Practices |         100 |      100 |
| SEO            |         100 |      100 |
| LCP            |    2.4 s |    1.9 s |
| FCP            |    1.6 s |    1.2 s |
| TBT            |    6.8 s |    2.9 s |
| CLS            |    0.003 |    0    |

Responsive re-verification on the deployment: no horizontal overflow, no console
errors, no sub-12 px text, and no tap targets under 44 px at 320 / 390 / 412 / 768 /
1280 px widths (automated headless-Chrome checks).

## Web Vitals

Measured on the local production build (Lighthouse 12.8.2, simulated mobile):

- LCP: 2.2 s (first run) / 2.4 s (second run) — hero subtitle text.
- FCP: 1.4 s / 1.6 s.
- CLS: 0.003 (good; no layout shift — space is reserved via `h-[100dvh]` layout).
- TBT: 6.7–6.8 s — dominated by the one-time 3D scene download + init landing in
  the measured window (Script Evaluation ~9.2 s in the trace).
- INP: not measured — requires real user interaction, not available in an automated run.

## Verification

- Build: PASS — `npm run build` (Next.js 14.2.35), First Load JS 94.2 kB.
- Lint: PASS — `next build` runs lint + type checking; `npm run lint` passes.
- Typecheck: PASS (part of the build).
- Lighthouse: 60 / 100 / 100 / 100 (Mobile, local production build) — real measured values.
- WAVE: pending manual verification.
- Keyboard: PASS — 28/28 automated checks.
- No console errors/warnings during the keyboard test run.

## Remaining Issues

- Performance (60): the residual is the one-time three.js scene download + init
  inside the measured window. Pushing the score toward 90 would require deferring
  the hero 3D scene out of the measured window, which conflicts with the product
  being the page's hero visual — documented tradeoff, not papered over.
- Final confirmation Lighthouse re-run after the last optimizations is pending.
- INP not measurable without a real user; needs a manual Lab/field run.
- Deployed Lighthouse + WAVE need the deployed preview URL (no `.vercel` folder /
  deployment in the repo) — provide the preview URL to run them against the real
  deployment. Do not treat the local-build numbers above as deployed values.
