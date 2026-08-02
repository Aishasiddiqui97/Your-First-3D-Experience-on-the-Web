"use client";

import { Suspense, memo, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls } from "@react-three/drei";
import FashionModel from "./FashionModel";
import LoadingFallback from "./LoadingFallback";
import { usePrefersReducedMotion } from "@/lib/customization";
import type { ColorOption, MaterialOption } from "@/lib/customization";

interface ThreeSceneProps {
  color: ColorOption;
  material: MaterialOption;
  wireframe: boolean;
  autoRotate: boolean;
}

/**
 * When the render loop is set to "demand" (reduced-motion mode) the canvas
 * only draws new frames when something asks for them. This tiny helper
 * invalidates the canvas whenever a customization prop changes so the new
 * material/color is still painted even without a running loop.
 */
function InvalidateOnChange({ deps }: { deps: unknown[] }) {
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return null;
}

/**
 * The WebGL scene: camera, lights, environment reflections, orbit controls
 * and the loaded fashion product. Wrapped in <Suspense> so the fallback
 * loader is shown while the GLB + environment are being fetched.
 */
function ThreeScene({ color, material, wireframe, autoRotate }: ThreeSceneProps) {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [3.1, 1.5, 3.7], fov: 38 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        frameloop={reducedMotion ? "demand" : "always"}
      >
        <ambientLight intensity={0.35} />
        <directionalLight position={[4, 6, 4]} intensity={1.1} />

        {/*
         * Studio-style image-based lighting built from Lightformers. This is
         * generated locally (no CDN fetch) so it works offline and renders
         * once (`frames={1}`), keeping the perf cost negligible.
         */}
        <Environment resolution={256} frames={1}>
          <Lightformer form="rect" intensity={3} position={[0, 4, 2]} scale={[6, 4, 1]} color="#ffffff" />
          <Lightformer form="rect" intensity={1.6} position={[-5, 1, -2]} rotation-y={Math.PI / 2} scale={[8, 2, 1]} color="#00E5C4" />
          <Lightformer form="rect" intensity={1.2} position={[5, 0, -1]} rotation-y={-Math.PI / 2} scale={[8, 2, 1]} color="#C8A24A" />
          <Lightformer form="ring" intensity={0.9} position={[0, 0, 5]} scale={5} color="#ffffff" />
        </Environment>

        <FashionModel color={color} material={material} wireframe={wireframe} />

        <OrbitControls
          makeDefault
          enablePan={false}
          minDistance={2.2}
          maxDistance={8}
          autoRotate={autoRotate}
          autoRotateSpeed={1.6}
          target={[0, 0.8, 0]}
        />

        {reducedMotion ? (
          <InvalidateOnChange deps={[color.id, material.id, wireframe, autoRotate]} />
        ) : null}
      </Canvas>
    </Suspense>
  );
}

export default memo(ThreeScene);
