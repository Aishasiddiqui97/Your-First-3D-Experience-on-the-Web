# Break Your Own Site — Hardening Report

**Assignment:** FE-10 Week 7 — "Break Your Own Site"
**Track:** General AI Fluency
**Portfolio:** AI Fashion Studio 3D — Virtual Product Customizer
**Developer:** Aisha.A.Siddiqui
**Live URL:** https://ai-fashion-studio-3d.vercel.app
**Date:** 17 Aug 2026

---

## 1. What I Tested

### Project Structure

- **Framework:** Next.js 14 (App Router) with TypeScript
- **3D Engine:** React Three Fiber + Three.js + @react-three/drei
- **Styling:** Tailwind CSS with custom plum/teal/gold palette
- **Deployment:** Vercel (production)
- **Pages:** Single-page application (`/` only)
- **Components:** ThreeScene, FashionModel, CustomizerPanel, ChatAssistant, LoadingFallback
- **Contact form:** None. The only form-like element is a client-side AI Chat Assistant with hardcoded responses (no backend, no email submission).
- **Navigation:** None. Single-page 3D product customizer.
- **External links:** None in the rendered page. Footer reads "Built by Aisha.A.Siddiqui · Powered by React Three Fiber".
- **Project demo links:** None.
- **GitHub/repository links:** None.
- **Social links:** None.
- **Download CV/resume button:** None.

### Edge Cases Tested (Chat Assistant)

| # | Test | Expected Behavior | Actual Behavior | Pass/Fail | Severity | Fix Required? |
|---|------|-------------------|-----------------|-----------|----------|---------------|
| A | Completely empty submission | Button disabled; form not submitted | Send button disabled when input is empty; `handleSubmit` returns early on empty trim | **PASS** | — | No |
| B | Empty name | N/A — no name field | No name field exists | N/A | — | N/A |
| C | Empty email | N/A — no email field | No email field exists | N/A | — | N/A |
| D | Empty message | Button disabled; form not submitted | Same as A | **PASS** | — | No |
| E.1 | Invalid email: `abc` | N/A — no email validation needed | Chat accepts any text, `pickReply` does string matching | **PASS** | — | No |
| E.2 | Invalid email: `abc@` | N/A | Same | **PASS** | — | No |
| E.3 | Invalid email: `abc.com` | N/A | Same | **PASS** | — | No |
| E.4 | Invalid email: `@gmail.com` | N/A | Same | **PASS** | — | No |
| F | Very long name | N/A — no name field | No name field | N/A | — | N/A |
| G | Very long email | N/A — no email field | No email field | N/A | — | No |
| H | Very long message (100KB) | Handled gracefully; no crash | React stores string in state; `pickReply` matches without crash; renders in `<li>` with `whitespace-pre-wrap`. No `maxLength` was set (now fixed to 2000). | **PASS** (after fix) | LOW | **Fixed** |
| I | Special characters `@#$%^&*()` | Handled without crash | `pickReply` does `.toLowerCase()` and `.includes()` — no crash, returns fallback reply | **PASS** | — | No |
| J | HTML-like input `<script>alert("test")</script>` | Rendered as text, no XSS | React auto-escapes JSX interpolation `{message.text}` — renders as visible text, no script execution | **PASS** | — | No |
| K | Multiple spaces | Trimmed on send | `input.trim()` strips leading/trailing; message preserves internal spaces | **PASS** | — | No |
| L | Copy/paste unusual text (unicode, emoji, RTL) | Handled natively | React handles unicode natively | **PASS** | — | No |
| M | Submit twice very quickly | Only one submission | When streaming starts: Send button unmounts, replaced by Stop button. `handleSubmit` also checks `if (streaming) return`. Double-submit impossible. | **PASS** | — | No |
| N | Repeated rapid submissions | Rate-limited by streaming state | After first send: `streaming=true`, input cleared. After Stop: `streaming=false` but input is empty so Send is disabled. Must type again to send. | **PASS** | — | No |

### Responsive / Viewport Testing

| Condition | Result | Notes |
|-----------|--------|-------|
| Desktop (1280px+) | **PASS** | Right-rail sidebar, full 3D viewport |
| Tablet (768px) | **PASS** | Sidebar still right-rail at md breakpoint |
| Mobile (390px) | **PASS** | Bottom sheet panel, no horizontal overflow |
| Narrow mobile (320px) | **PASS** | Panel adapts, text wraps, no overflow |
| Auto-rotation off on mobile | **PASS** | Defaults OFF on coarse pointer / ≤768px |
| Horizontal scrolling | **None detected** | `overflow-hidden` on body + `h-[100dvh]` layout |
| Text overflow | **None detected** | `max-w-*` constraints on headings and text |
| Image overflow | **None** | 3D canvas fills viewport; model auto-centered |

### Interactive Element Testing

| Element | Tested | Working | Notes |
|---------|--------|---------|-------|
| Color radio buttons (4) | Yes | Yes | Roving tabindex, Arrow/Home/End keyboard navigation |
| Material radio buttons (3) | Yes | Yes | Same keyboard pattern |
| Wireframe toggle | Yes | Yes | `role="switch"`, `aria-checked`, Space toggles |
| Auto rotate toggle | Yes | Yes | Same pattern |
| AI Assistant launcher | Yes | Yes | Opens dialog, `aria-expanded` toggles |
| AI Assistant close button | Yes | Yes | Closes dialog, returns focus to launcher |
| AI Assistant Send button | Yes | Yes | Disabled when empty, `aria-label` present |
| AI Assistant Stop button | Yes | Yes | Appears during streaming, `aria-label="Stop response"` |
| 3D orbit controls | Yes | Yes | Drag to rotate, scroll to zoom, pan disabled |
| Chat textarea | Yes | Yes | `Enter` sends, `Shift+Enter` newline, `maxLength=2000` |

### Link Testing

| Link Type | Count | Result |
|-----------|-------|--------|
| Navigation links | 0 | N/A — single-page app |
| External links | 0 | None in rendered HTML |
| Demo links | 0 | None |
| GitHub/repository links | 0 | None |
| Social links | 0 | None |
| Email links | 0 | None |
| Download CV/resume | 0 | None |
| Footer links | 0 | Text-only "Built by Aisha.A.Siddiqui · Powered by React Three Fiber" (not clickable) |
| Logo link | 0 | "Virtual Atelier" is decorative text, not a link |

**Finding:** This is a single-page 3D product customizer, not a traditional portfolio with navigation, project links, or contact methods. There are zero links to test. This is a structural limitation documented in Section 4.

---

## 2. Where It Broke

### Issues Discovered

| # | Issue | Discovered Via | Severity | Status |
|---|-------|---------------|----------|--------|
| 1 | No developer name in page title or metadata | Code review + SEO check | **HIGH** | **FIXED** |
| 2 | No Open Graph metadata (og:title, og:description, og:url) | Code review + live HTML inspection | **HIGH** | **FIXED** |
| 3 | No Twitter/X card metadata | Code review | **HIGH** | **FIXED** |
| 4 | No canonical URL | Code review | **HIGH** | **FIXED** |
| 5 | No `robots.txt` (404 on fetch) | Live site fetch | **MEDIUM** | **FIXED** |
| 6 | No `sitemap.xml` (404 on fetch) | Live site fetch | **MEDIUM** | **FIXED** |
| 7 | No security headers (X-Content-Type-Options, X-Frame-Options, etc.) | `vercel.json` review | **HIGH** | **FIXED** |
| 8 | Footer text `text-[10px]` below 12px minimum readability | Code review (missed by previous audit) | **LOW** | **FIXED** |
| 9 | Chat textarea has no `maxLength` — extreme input possible | Edge case testing | **LOW** | **FIXED** (2000 chars) |
| 10 | No `<meta name="author">` tag | Code review | **MEDIUM** | **FIXED** (via `authors` field) |

---

## 3. Fixed Issues

### Fix 1: SEO Metadata — Developer Name + Open Graph + Twitter Cards + Canonical

**Problem:** Page title was "AI Fashion Studio 3D — Virtual Product Customizer" with no mention of the developer. No Open Graph or Twitter metadata existed. Sharing the URL on social media would show a generic, unbranded preview.

**Fix:** Updated `src/app/layout.tsx` with comprehensive metadata:
- Title now includes developer name: "AI Fashion Studio 3D — Virtual Product Customizer | Aisha.A.Siddiqui"
- Added `authors`, `creator`, `metadataBase`, `alternates.canonical`
- Added full `openGraph` block (type, url, siteName, title, description)
- Added `twitter` card block (card type, title, description)
- Enhanced description to mention the developer and technologies used

**Evidence (before):**
```html
<title>AI Fashion Studio 3D — Virtual Product Customizer</title>
<meta name="description" content="Design, customize and explore fashion products in an immersive 3D experience."/>
<!-- No OG tags, no Twitter tags, no canonical -->
```

**Evidence (after — code-verified, will appear after deployment):**
```html
<title>AI Fashion Studio 3D — Virtual Product Customizer | Aisha.A.Siddiqui</title>
<meta name="description" content="An interactive 3D fashion product customizer built by Aisha.A.Siddiqui..."/>
<meta name="author" content="Aisha.A.Siddiqui"/>
<link rel="canonical" href="https://ai-fashion-studio-3d.vercel.app/"/>
<meta property="og:type" content="website"/>
<meta property="og:title" content="AI Fashion Studio 3D — Virtual Product Customizer | Aisha.A.Siddiqui"/>
<meta property="og:description" content="An interactive 3D fashion product customizer built by Aisha.A.Siddiqui..."/>
<meta property="og:url" content="https://ai-fashion-studio-3d.vercel.app"/>
<meta property="og:site_name" content="AI Fashion Studio 3D"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="AI Fashion Studio 3D — Virtual Product Customizer | Aisha.A.Siddiqui"/>
<meta name="twitter:description" content="An interactive 3D fashion product customizer built by Aisha.A.Siddiqui..."/>
```

**Retest:** Build passes, lint clean, HTML output verified in build.

### Fix 2: robots.txt

**Problem:** `https://ai-fashion-studio-3d.vercel.app/robots.txt` returned 404. Search engine crawlers had no directives.

**Fix:** Created `public/robots.txt` with `Allow: /` and sitemap reference.

**Evidence (before):** HTTP 404 on `/robots.txt`
**Evidence (after):** File exists in `public/robots.txt`, will be served at `/robots.txt` after deployment.

**Retest:** Build passes, file included in static output.

### Fix 3: sitemap.xml

**Problem:** `https://ai-fashion-studio-3d.vercel.app/sitemap.xml` returned 404.

**Fix:** Created `src/app/sitemap.ts` using Next.js Metadata API. Generates a single-entry sitemap for the homepage.

**Evidence (before):** HTTP 404 on `/sitemap.xml`
**Evidence (after):** Route `/sitemap.xml` generated in build output. Returns XML with the homepage URL, `lastModified`, `changeFrequency: "monthly"`, `priority: 1`.

**Retest:** Build output confirms `/sitemap.xml` route generated.

### Fix 4: Security Headers

**Problem:** `vercel.json` had no security headers. The site was missing standard protections: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy.

**Fix:** Added five security headers to the catch-all route in `vercel.json`:
- `X-Content-Type-Options: nosniff` — prevents MIME-type sniffing
- `X-Frame-Options: DENY` — prevents clickjacking
- `X-XSS-Protection: 1; mode=block` — legacy XSS filter
- `Referrer-Policy: strict-origin-when-cross-origin` — limits referrer leakage
- `Permissions-Policy: camera=(), microphone=(), geolocation=()` — disables unused APIs

**Evidence (before):** No security headers in `vercel.json`
**Evidence (after):** Headers added to `vercel.json`, will be applied after deployment.

**Retest:** Build passes, `vercel.json` is valid JSON.

### Fix 5: Footer Text Below 12px Minimum

**Problem:** Footer text "Powered by React Three Fiber" used `text-[10px]` (10px), below the 12px minimum readability threshold identified in the previous audit.

**Fix:** Changed to `text-[12px]` and updated text to "Built by Aisha.A.Siddiqui · Powered by React Three Fiber".

**Evidence (before):** `text-[10px]` → "Powered by React Three Fiber"
**Evidence (after):** `text-[12px]` → "Built by Aisha.A.Siddiqui · Powered by React Three Fiber"

**Retest:** Build passes, lint clean.

### Fix 6: Chat Textarea maxLength

**Problem:** The chat assistant textarea had no `maxLength` attribute. A user could paste an extremely large string (100KB+) into the input, potentially causing rendering lag in the message list.

**Fix:** Added `maxLength={2000}` to the textarea in `ChatAssistant.tsx`.

**Evidence (before):** No `maxLength` attribute
**Evidence (after):** `maxLength={2000}` — caps input at 2000 characters, more than enough for any chat message.

**Retest:** Build passes, lint clean.

---

## 4. Known Limitations

### Limitation 1: No Navigation, Project Links, or Contact Methods
- **Issue:** The site has zero navigation links, zero project demo links, zero GitHub links, zero social links, and zero contact methods (no email, no contact form, no phone).
- **Why:** This is a single-page 3D product customizer, not a traditional multi-page portfolio. The assignment says "Do not redesign the portfolio." Adding navigation/links would be a redesign.
- **Severity:** HIGH — but structural, not a bug.

### Limitation 2: Chat Assistant Uses Hardcoded Responses (No Backend)
- **Issue:** The AI Chat Assistant returns random hardcoded replies. It does not connect to any AI service or backend.
- **Why:** Intentional design — the chat is a client-side demo to showcase the UI pattern. No API keys or backend infrastructure exists.
- **Severity:** MEDIUM — functional but not genuinely intelligent.

### Limitation 3: No OG Image (Social Share Shows No Image)
- **Issue:** The `openGraph` metadata does not include an `images` field. Social media shares will show the URL preview without a custom image.
- **Why:** Creating an appropriate OG image requires design work beyond the scope of this hardening assignment. The site's hero is a dynamic 3D scene that cannot be statically captured as a simple image.
- **Severity:** MEDIUM — social shares work but look incomplete.

### Limitation 4: Performance Score (67 Mobile) — Three.js Bundle
- **Issue:** Lighthouse Performance score is 67 on mobile (deployed). TBT is 2,910ms. The three.js runtime (~1 MB parsed) loads inside the measured window despite lazy loading.
- **Why:** The 3D scene IS the page's hero content. Deferring it entirely would leave users with a blank screen. The current approach (lazy-load after first paint, demand-mode rendering) is the practical optimum for a 3D-first page.
- **Severity:** MEDIUM — documented tradeoff, not a bug.

### Limitation 5: Site Not Indexed by Google
- **Issue:** Searching "Aisha Siddiqui portfolio" does not show this specific deployment (ai-fashion-studio-3d.vercel.app). The developer's main portfolio at aisha-siddiqui.vercel.app and LinkedIn/GitHub profiles rank instead.
- **Why:** Google indexing takes time (days to weeks). SEO metadata changes do not instantly create rankings. The site is a course assignment, not a production portfolio.
- **Severity:** LOW — expected for a new deployment.

### Limitation 6: No WAVE Browser Extension Verification
- **Issue:** WAVE accessibility results are pending. WAVE has no CLI and must be run via browser extension against deployed pages.
- **Why:** Cannot install browser extensions in this environment.
- **Severity:** LOW — Lighthouse Accessibility score is 100, and keyboard testing passed 28/28 checks.

### Limitation 7: No INP (Interaction to Next Paint) Measurement
- **Issue:** INP requires real user interaction data (CrUX or field data). Cannot be measured in an automated lab test.
- **Why:** INP is a field-only metric.
- **Severity:** LOW — standard limitation for lab testing.

### Limitation 8: GLB Model Uncompressed
- **Issue:** The 3D model (`fashion-bag.glb`) is ~189KB uncompressed. Draco/meshopt compression could reduce this.
- **Why:** Intentional tradeoff — uncompressed avoids the ~100KB decoder cost and keeps the project self-contained/offline-capable. Documented in README.
- **Severity:** LOW — 189KB is small for a 3D model.

### Limitation 9: WebGL Required — No Graceful Fallback for Very Old Browsers
- **Issue:** Browsers without WebGL support see the loading spinner indefinitely.
- **Why:** The 3D experience IS the product. A non-WebGL fallback would be a different application. The loading state at least communicates that something is loading.
- **Severity:** LOW — WebGL is supported by 97%+ of browsers.

---

## 5. SEO / Metadata

### After Fixes (Code-Verified, Pending Deployment)

| Element | Before | After |
|---------|--------|-------|
| **Page title** | "AI Fashion Studio 3D — Virtual Product Customizer" | "AI Fashion Studio 3D — Virtual Product Customizer \| Aisha.A.Siddiqui" |
| **Meta description** | "Design, customize and explore fashion products in an immersive 3D experience." | "An interactive 3D fashion product customizer built by Aisha.A.Siddiqui. Design, customize and explore fashion products in an immersive browser-based experience using Next.js and React Three Fiber." |
| **Author** | None | `Aisha.A.Siddiqui` (via `authors` + `creator` fields) |
| **Canonical URL** | None | `https://ai-fashion-studio-3d.vercel.app/` |
| **Open Graph title** | None | Same as page title |
| **Open Graph description** | None | Same as meta description |
| **Open Graph URL** | None | `https://ai-fashion-studio-3d.vercel.app` |
| **Open Graph type** | None | `website` |
| **Open Graph site name** | None | "AI Fashion Studio 3D" |
| **Open Graph image** | None | None (see Limitation 3) |
| **Twitter card** | None | `summary_large_image` |
| **Twitter title** | None | Same as page title |
| **Twitter description** | None | Same as meta description |
| **robots.txt** | 404 | `Allow: /` + sitemap reference |
| **sitemap.xml** | 404 | Generated via Next.js Metadata API |
| **Favicon** | SVG icon (diamond shape) | Already existed — no change needed |
| **Viewport** | `width=device-width, initial-scale=1` | Already correct — no change needed |
| **Theme color** | `#0F0B1F` | Already correct — no change needed |
| **Heading structure** | h1 → h2 → h3 (correct) | Already correct — no change needed |

---

## 6. Performance

### Tool: Lighthouse 12.8.2 (Mobile form factor)

**Source:** AUDIT.md — deployed Lighthouse against `https://ai-fashion-studio-3d.vercel.app` on 16 Aug 2026.

| Metric | Score |
|--------|-------|
| **Performance** | 67 |
| **Accessibility** | 100 |
| **Best Practices** | 100 |
| **SEO** | 100 |

### Web Vitals (Deployed)

| Metric | Value | Rating |
|--------|-------|--------|
| LCP | 1.9s | Good |
| FCP | 1.2s | Good |
| TBT | 2,910ms | Needs Improvement |
| CLS | 0 | Good |

### Major Findings

1. **TBT (2,910ms)** is the primary performance bottleneck — caused by the one-time three.js scene download and initialization inside the Lighthouse measurement window.
2. **LCP (1.9s)** is good — hero text paints quickly due to lazy-loading the 3D scene.
3. **CLS (0)** is perfect — `h-[100dvh]` layout reserves space, no layout shifts.
4. **Performance optimizations already applied** from prior audit:
   - Lazy-loaded WebGL via `next/dynamic({ ssr: false })`
   - `requestIdleCallback` delays scene mount
   - Auto-rotation OFF on mobile by default
   - Environment map baked at 128px (`frames={1}`)
   - Contact shadows at 128px (`frames={1}`)
   - `frameloop="demand"` when auto-rotate is off
   - `useFrame` only invalidates while animating
   - Material snaps on first paint, animates on subsequent changes
   - DPR capped at `[1, 1.5]`

### Fixes Performed in This Assignment

No additional performance fixes — the prior audit already addressed the major items. The remaining TBT is an inherent cost of a 3D hero experience.

---

## 7. Accessibility

### Checks Performed

| Check | Result | Notes |
|-------|--------|-------|
| Images have meaningful alt text | **PASS** | 3D canvas: `role="img"` + `aria-label`. Decorative gradient: `aria-hidden="true"`. SVG icons: `aria-hidden="true"`. |
| Form inputs have labels | **PASS** | Chat textarea has `<label className="sr-only">` linked via `htmlFor`/`id`. |
| Buttons have accessible names | **PASS** | All buttons have either `aria-label` or visible text content. |
| Keyboard navigation works | **PASS** | 28/28 automated keyboard checks passed (see AUDIT.md). |
| Focus states are visible | **PASS** | All interactive elements have `focus-visible:ring-2 focus-visible:ring-teal`. |
| Color contrast is readable | **PASS** | Toggle off-state contrast fixed (bg-white/30 → bg-white/40 ≈ 3.8:1). |
| Headings follow hierarchy | **PASS** | h1 → h2 → h3 correct. |
| Links distinguishable | **N/A** | No links in the page. |
| Mobile menu accessible | **N/A** | No mobile menu — customizer is a bottom sheet on mobile. |
| Form errors understandable | **PASS** | Empty input prevented by disabled button + early return in handler. No error message needed. |
| `prefers-reduced-motion` respected | **PASS** | Auto-rotate off, `frameloop="demand"`, material snaps instantly. |
| Focus trap in dialog | **PASS** | Tab/Shift+Tab wraps inside chat dialog; Escape closes. |
| Live region for streaming | **PASS** | `role="status"` with polite announcements. |
| Text minimum 12px | **PASS** (after fix) | Footer text raised from 10px to 12px. |

### Fixes Performed

1. Footer text `text-[10px]` → `text-[12px]` (readability)
2. Footer text updated to include developer attribution

---

## 8. Final Status

| Criterion | Status |
|-----------|--------|
| Core functionality works | **YES** — 3D product customizer loads, color/material switching works, orbit controls work |
| Contact form works | **N/A** — No contact form. Chat assistant works (all edge cases pass). |
| Main links work | **N/A** — No links in the page (single-page 3D app) |
| Mobile layout works | **YES** — Bottom sheet panel, no overflow, auto-rotate off by default |
| SEO metadata exists | **YES** (after fix) — Title, description, author, OG, Twitter, canonical, robots.txt, sitemap.xml |
| Social metadata exists | **YES** (after fix) — OG + Twitter card tags (no image — see Limitation 3) |
| Performance was checked | **YES** — Lighthouse 67/100/100/100 (deployed) |
| Fix-now issues identified | **YES** — 10 issues found |
| Fix-now issues fixed | **YES** — All 10 fixed |
| Fixes retested | **YES** — Build passes, lint clean, code verified |
| Known limitations documented | **YES** — 9 limitations documented with honest explanations |
| Security headers added | **YES** — 5 headers added to vercel.json |
| Build passes | **YES** — `npm run build` compiles successfully |
| Lint passes | **YES** — `npm run lint` reports no warnings or errors |

---

## Hardening Review Checklist

- [x] Empty form tested — button disabled, handler rejects empty
- [x] Garbage/invalid input tested — handled gracefully
- [x] Very long input tested — `maxLength=2000` added
- [x] Special characters tested — no crash
- [x] Double submission tested — prevented by streaming state
- [x] Mobile layout tested — bottom sheet, no overflow
- [x] Navigation tested — N/A (no navigation)
- [x] All important links tested — N/A (no links)
- [x] Demo links tested — N/A (none exist)
- [x] Repository links tested — N/A (none exist)
- [x] Contact form tested — N/A (chat assistant tested instead)
- [x] Accessibility checked — 100/100 Lighthouse, 28/28 keyboard checks
- [x] SEO title added/verified — includes developer name
- [x] Meta description added/verified — includes developer name + technologies
- [x] Social preview metadata added/verified — OG + Twitter card
- [x] Speed checked — Lighthouse 67 mobile, CLS 0, LCP 1.9s
- [x] Fix-now issues identified — 10 issues
- [x] Fix-now issues fixed — all 10 fixed
- [x] Fixes retested — build + lint pass, code verified
- [x] Known limitations documented — 9 limitations with honest explanations
- [x] Final build passes — `npm run build` ✓, `npm run lint` ✓
