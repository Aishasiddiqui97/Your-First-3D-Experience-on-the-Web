"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import CustomizerPanel from "@/components/CustomizerPanel";
import LoadingFallback from "@/components/LoadingFallback";
import {
  COLOR_BY_ID,
  MATERIAL_BY_ID,
  usePrefersReducedMotion,
} from "@/lib/customization";
import type { ColorOptionId, MaterialOptionId } from "@/lib/customization";

/**
 * The 3D canvas is lazy-loaded (client-only) so that the WebGL runtime is
 * only fetched after the page's shell has rendered. `ssr: false` also avoids
 * trying to render WebGL on the server.
 */
const ThreeScene = dynamic(() => import("@/components/ThreeScene"), {
  ssr: false,
  loading: () => <LoadingFallback />,
});

export default function Home() {
  const reducedMotion = usePrefersReducedMotion();

  const [colorId, setColorId] = useState<ColorOptionId>("emerald");
  const [materialId, setMaterialId] = useState<MaterialOptionId>("fabric");
  const [wireframe, setWireframe] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);

  // If the user prefers reduced motion, never auto-rotate the scene.
  useEffect(() => {
    if (reducedMotion) setAutoRotate(false);
  }, [reducedMotion]);

  const color = COLOR_BY_ID[colorId];
  const material = MATERIAL_BY_ID[materialId];

  const handleWireframeChange = useCallback((value: boolean) => {
    setWireframe(value);
  }, []);

  const handleAutoRotateChange = useCallback((value: boolean) => {
    setAutoRotate(value);
  }, []);

  return (
    <main className="relative h-[100dvh] w-full overflow-hidden bg-plum text-white">
      {/* Subtle teal glow behind the product. */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,229,196,0.08),transparent_60%)]" />

      {/* 3D scene fills the whole viewport. */}
      <div className="absolute inset-0">
        <ThreeScene
          color={color}
          material={material}
          wireframe={wireframe}
          autoRotate={autoRotate && !reducedMotion}
        />
      </div>

      {/* Hero heading (pointer-events-none so it never blocks orbit controls). */}
      <header className="pointer-events-none absolute left-0 top-0 z-10 p-5 sm:p-8 md:left-8 md:top-6">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-teal shadow-[0_0_12px_#00E5C4]" />
          <span className="text-[11px] font-medium uppercase tracking-[0.35em] text-gold">
            Virtual Atelier
          </span>
        </div>
        <h1 className="mt-3 max-w-xl font-display text-3xl leading-tight sm:text-5xl md:text-[3.4rem]">
          AI Fashion Studio{" "}
          <span className="bg-gradient-to-r from-teal to-gold bg-clip-text text-transparent">
            3D
          </span>
        </h1>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-white/70 sm:text-base">
          Design, customize and explore fashion products in an immersive 3D
          experience.
        </p>
      </header>

      {/* Interaction hint (desktop only). */}
      <div className="pointer-events-none absolute bottom-4 left-5 z-10 hidden text-xs uppercase tracking-[0.25em] text-white/35 sm:block">
        Drag to orbit · Scroll to zoom
      </div>

      <CustomizerPanel
        colorId={colorId}
        materialId={materialId}
        wireframe={wireframe}
        autoRotate={autoRotate}
        onColorChange={setColorId}
        onMaterialChange={setMaterialId}
        onWireframeChange={handleWireframeChange}
        onAutoRotateChange={handleAutoRotateChange}
      />
    </main>
  );
}
