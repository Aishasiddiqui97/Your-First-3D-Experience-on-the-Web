# AI Fashion Studio 3D — Virtual Product Customizer

An interactive 3D fashion product experience built with **Next.js 14 (App Router)**, **React Three Fiber**, **Three.js** and **Tailwind CSS**. Users can orbit, zoom, re-colour and re-material a virtual fashion tote in a studio-lit scene — all running in the browser.

---

## What was built

- **Real 3D product in the browser** — a procedural fashion tote exported to a binary GLB and rendered with React Three Fiber (`useGLTF`).
- **Studio lighting & environment** — a locally-generated image-based lighting rig (drei `Environment` + `Lightformer`) plus ambient/directional lights. No CDN fetch, so it works offline.
- **Orbit controls** — rotate and zoom with `OrbitControls` (pan disabled, distance clamped, model auto-centered).
- **Color customization** — Emerald Green, Gold, Black, White.
- **Material customization** — Fabric, Silk, Metallic (roughness / metalness / clearcoat / sheen presets).
- **Display toggles** — Wireframe mode and Auto-rotate.
- **Smooth material transitions** — physical material properties are lerped in `useFrame` toward their targets, giving a fluid "morphing finish" when you switch materials.
- **Modern fashion-tech UI** — Midnight Plum (#0F0B1F) background, Teal (#00E5C4) and Gold (#C8A24A) accents, hero heading + subtitle, responsive right-rail sidebar (bottom sheet on mobile).
- **Accessibility & performance** — reduced-motion support, keyboard-accessible controls, lazy-loaded WebGL, `Suspense` fallback. See [Performance](#performance) and [Accessibility](#accessibility).

## Technologies used

| Layer      | Tech                                                          |
| ---------- | ------------------------------------------------------------- |
| Framework  | Next.js 14 (App Router), TypeScript                           |
| 3D         | React Three Fiber, Three.js, @react-three/drei                |
| Styling    | Tailwind CSS (custom theme: `plum`, `teal`, `gold` palettes)  |
| Model      | Procedurally generated GLB (Three.js `GLTFExporter`)          |
| Fonts      | Space Grotesk + Playfair Display (via `next/font`)            |
| Deploy     | Vercel                                                        |

## How to run locally

```bash
# 1. Install dependencies
npm install

# 2. (Optional) Regenerate the GLB model
#    Re-runs scripts/generate-model.mjs -> public/models/fashion-bag.glb
npm run model:generate

# 3. Start the dev server
npm run dev
# Open http://localhost:3000

# Production build
npm run build && npm start
```

### Project structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout, fonts, metadata, theme-color
│   ├── page.tsx            # Hero + lazy-loaded ThreeScene + customizer state
│   └── globals.css         # Tailwind + reduced-motion + scrollbar styling
├── components/
│   ├── ThreeScene.tsx      # Canvas, lights, Environment, OrbitControls
│   ├── FashionModel.tsx    # useGLTF model + material animation
│   ├── CustomizerPanel.tsx # Sidebar UI (colors, materials, toggles)
│   └── LoadingFallback.tsx # Suspense/loader fallback
└── lib/
    └── customization.ts    # Shared types + option data (no three import)
scripts/
└── generate-model.mjs      # Builds the GLB from Three.js primitives
public/models/fashion-bag.glb
```

## Performance

The performance budget is managed at several levels:

- **Model size** — the GLB is generated from low-segment primitives (~189 KB) and contains only position/normal/UV data for a handful of meshes. It loads in one small request. A real production asset could go further with Draco/meshopt compression; the project is structured so you can drop in any GLB.
- **Lazy loading** — the entire WebGL runtime (`ThreeScene`) is loaded with `next/dynamic(..., { ssr: false })` and only fetched after the page shell has painted. Confirmed by the build output: the page's First Load JS is **~91 kB**; the heavy three.js chunk is split off and loaded on demand.
- **Suspense fallback** — the canvas is wrapped in `<Suspense>`; while the GLB + environment are fetched, `LoadingFallback` renders a lightweight status indicator.
- **Framerate considerations** — `dpr` is capped at `[1, 1.5]`, the environment is baked once (`frames={1}`) at 256px, contact shadows are a single static frame, and material property mutation happens in-place in `useFrame` (no React re-renders). `memo` is used on all components so the UI panel and scene never re-render each other unnecessarily.
- **Mobile performance** — capped DPR + static environment keep fill rate low; the panel collapses to a bottom sheet so the canvas keeps full viewport.
- **Avoid unnecessary re-renders** — customization state lives in `page.tsx`; scene and panel are `memo`'d, and animation targets are held in refs.

## Accessibility

- `prefers-reduced-motion` disables auto-rotate and **switches the canvas to `frameloop="demand"`**, so the render loop only paints on demand; material changes snap instantly instead of animating.
- All interactive controls are real `<button>`s with proper `role="radio"` / `role="switch"`, `aria-checked`, labels and visible `:focus-visible` rings — fully operable by keyboard.
- The loader uses `role="status"` with `aria-live="polite"`.
- Semantic `header` / `aside` / `main` landmarks and an `aria-label` on the customizer.

## FE-10 reflection: impact on loading time and FPS

FE-10 in this project refers to **performance budgets for 3D experiences** — specifically how bundling, asset size and the render loop affect **loading time** and **frames per second (FPS)**.

**Impact on loading time.** The two biggest loading costs in a 3D app are the WebGL runtime bundle (three.js + fiber + drei) and the model asset. Both are kept off the critical path:

- The page shell loads in **~91 kB First Load JS**; the 3D runtime (~1 MB parsed) is fetched only after first paint via `next/dynamic`. This means the hero text, theme and loader appear instantly, and time-to-interactive for the UI is not blocked by WebGL.
- The model is **~189 kB** and uncompressed — small enough that it ships in one request with no network round-trip churn. Because `useGLTF` suspends, the model only starts loading when the canvas mounts, and the loader fallback hides the gap.
- Practical effect: `Largest Contentful Paint` is dominated by the small static shell, while the 3D scene appears shortly after as a progressive enhancement. Users on slow connections get a useful (styled, responsive) page almost immediately instead of a blank canvas.

**Impact on FPS.** FPS in a three.js scene is bounded by draw calls, overdraw, and how often you recompute frames:

- Draw calls are minimal (the tote is ~8 meshes, single draw call each), so fill rate is the main GPU cost — capped via `dpr={[1, 1.5]}` and a low-res environment.
- The environment (studio IBL) is rendered **once** (`frames={1}`, 256px) instead of every frame, and contact shadows are static (`frames={1}`) — the two classic "expensive every-frame" effects are eliminated.
- Material animation mutates `THREE` objects directly in `useFrame` and never touches React state, so the render loop stays at the GPU's natural rate with zero React reconciliation cost.
- The render loop runs continuously only when animating; under `prefers-reduced-motion` it switches to **demand mode** and effectively idles at 0% GPU when nothing changes.
- Practical effect: the scene comfortably holds 60 FPS on mid-range hardware, and the DPR cap ensures mobile GPUs aren't over-sampled (the usual cause of 30 FPS jank).

**Trade-offs.** Uncompressed geometry trades a little loading time for zero CPU-side decompression cost; the segment counts were tuned so the visual quality loss is imperceptible at typical camera distances. For a larger production model you would enable Draco compression (save bytes at the cost of ~100 KB decoder + decode time) — a trade-off this project deliberately avoids to keep the demo self-contained and offline-capable.

## Future improvements

- **Real product assets** — swap the procedural tote for scanned/CAD fashion products (footwear, apparel, accessories) with PBR texture maps.
- **Draco/meshopt compression** — cut model bytes further for large assets.
- **AR preview** — drop the GLB into `model-viewer` for an "view in your room" experience.
- **Configurator state** — persist choices in the URL (`?color=gold&material=silk`) or a headless CMS so the customizer doubles as a marketing landing page.
- **Lighting presets** — toggle between studio, runway and outdoor lighting rigs.
- **Hotspots** — clickable parts (handle, clasp, body) that highlight and jump to per-part customization.
- **SSR-safe preloading** — preload the GLB via `Link`/`preload` on hover so the 3D scene feels instant.

## Deployment (Vercel)

The project is a standard Next.js app and deploys to Vercel with zero configuration.

### Deploy via the CLI

```bash
npm i -g vercel
vercel        # first deploy (dev/preview)
vercel --prod # production
```

### Deploy via the dashboard

1. Push the repository to GitHub.
2. In the Vercel dashboard choose **New Project** → import the repo.
3. Vercel auto-detects Next.js; keep the default build command (`next build`) and output directory (`.next`).
4. Click **Deploy**. That's it — the `vercel.json` file in the repo pins the framework and headers.

### Verify locally first

```bash
npm run build
vercel build && vercel preview
```
