"use client";

import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { ContactShadows, useGLTF } from "@react-three/drei";
import {
  MATERIAL_BY_ID,
  usePrefersReducedMotion,
} from "@/lib/customization";
import type { ColorOption, MaterialOption } from "@/lib/customization";

interface FashionModelProps {
  color: ColorOption;
  material: MaterialOption;
  wireframe: boolean;
}

/**
 * One live material + the values we are animating towards. Keeping targets in
 * a ref (not React state) lets us mutate material properties every frame in
 * `useFrame` without triggering React re-renders.
 */
interface MaterialState {
  material: THREE.MeshPhysicalMaterial;
  targetColor: THREE.Color;
  targetRoughness: number;
  targetMetalness: number;
  targetClearcoat: number;
  targetClearcoatRoughness: number;
  targetSheen: number;
}

function FashionModel({ color, material, wireframe }: FashionModelProps) {
  const { scene } = useGLTF("/models/fashion-bag.glb");
  const reducedMotion = usePrefersReducedMotion();
  const materialsRef = useRef<MaterialState[]>([]);

  // The GLB ships with MeshStandardMaterial nodes. We replace them with
  // MeshPhysicalMaterial clones (clearcoat/sheen support needed for the
  // Silk finish) while keeping each part's original colour.
  useEffect(() => {
    const states: MaterialState[] = [];
    scene.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;

      const old = (Array.isArray(mesh.material)
        ? mesh.material[0]
        : mesh.material) as THREE.MeshStandardMaterial;

      const next = new THREE.MeshPhysicalMaterial();
      next.name = old.name;
      next.color.copy(old.color);
      next.roughness = old.roughness;
      next.metalness = old.metalness;
      mesh.material = next;

      states.push({
        material: next,
        targetColor: next.color.clone(),
        targetRoughness: next.roughness,
        targetMetalness: next.metalness,
        targetClearcoat: 0,
        targetClearcoatRoughness: 0,
        targetSheen: 0,
      });
    });
    materialsRef.current = states;
  }, [scene]);

  const colorHex = useMemo(() => new THREE.Color(color.hex), [color.hex]);
  const appliedOnceRef = useRef(false);

  // Store the new desired look. Reduced-motion users snap instantly instead
  // of animating, so nothing lingers mid-transition. The very first apply
  // (initial mount) also snaps: the product appears immediately in its chosen
  // finish instead of fading in, keeping the first frame cheap.
  const applyTargets = useCallback(() => {
    const preset = MATERIAL_BY_ID[material.id];
    const snap = reducedMotion || !appliedOnceRef.current;
    for (const state of materialsRef.current) {
      state.targetColor.copy(colorHex);
      state.targetRoughness = preset.roughness;
      state.targetMetalness = preset.metalness;
      state.targetClearcoat = preset.clearcoat;
      state.targetClearcoatRoughness = preset.clearcoatRoughness;
      state.targetSheen = preset.sheen;

      if (snap) {
        state.material.color.copy(state.targetColor);
        state.material.roughness = state.targetRoughness;
        state.material.metalness = state.targetMetalness;
        state.material.clearcoat = state.targetClearcoat;
        state.material.clearcoatRoughness = state.targetClearcoatRoughness;
        state.material.sheen = state.targetSheen;
      }
    }
    appliedOnceRef.current = true;
  }, [colorHex, material.id, reducedMotion]);

  useEffect(() => {
    applyTargets();
  }, [applyTargets]);

  // Wireframe is a flat state change - apply it directly, no animation needed.
  useEffect(() => {
    for (const state of materialsRef.current) {
      state.material.wireframe = wireframe;
    }
  }, [wireframe]);

  /**
   * Smooth material transition: each frame we lerp every physical property
   * towards its target. `useFrame` runs inside the render loop and mutates
   * the materials in place, which avoids any React re-render cost.
   *
   * When the canvas is in demand mode (reduced motion or auto-rotate off) the
   * transition must keep asking for frames, so we call `state.invalidate()`
   * while any property is still moving and stop as soon as it settles — this
   * lets the GPU/main thread idle once the scene is static.
   */
  useFrame((state) => {
    if (reducedMotion) return;
    const t = 0.09;
    let animating = false;
    for (const s of materialsRef.current) {
      s.material.color.lerp(s.targetColor, t);
      s.material.roughness = THREE.MathUtils.lerp(
        s.material.roughness,
        s.targetRoughness,
        t,
      );
      s.material.metalness = THREE.MathUtils.lerp(
        s.material.metalness,
        s.targetMetalness,
        t,
      );
      s.material.clearcoat = THREE.MathUtils.lerp(
        s.material.clearcoat,
        s.targetClearcoat,
        t,
      );
      s.material.clearcoatRoughness = THREE.MathUtils.lerp(
        s.material.clearcoatRoughness,
        s.targetClearcoatRoughness,
        t,
      );
      s.material.sheen = THREE.MathUtils.lerp(
        s.material.sheen,
        s.targetSheen,
        t,
      );

      const moving =
        Math.abs(s.material.color.r - s.targetColor.r) > 0.002 ||
        Math.abs(s.material.color.g - s.targetColor.g) > 0.002 ||
        Math.abs(s.material.color.b - s.targetColor.b) > 0.002 ||
        Math.abs(s.material.roughness - s.targetRoughness) > 0.001 ||
        Math.abs(s.material.metalness - s.targetMetalness) > 0.001 ||
        Math.abs(s.material.clearcoat - s.targetClearcoat) > 0.001 ||
        Math.abs(s.material.clearcoatRoughness - s.targetClearcoatRoughness) >
          0.001 ||
        Math.abs(s.material.sheen - s.targetSheen) > 0.001;
      if (moving) animating = true;
    }
    if (animating) state.invalidate();
  });

  // Center/scale bookkeeping: lift the model so its base rests on y = 0 and
  // size the soft contact shadow to match its footprint.
  const placement = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    return {
      y: -box.min.y,
      shadowScale: Math.max(size.x, size.z) * 2.4,
    };
  }, [scene]);

  return (
    <group>
      <group position={[0, placement.y, 0]}>
        <primitive object={scene} />
      </group>
      <ContactShadows
        position={[0, placement.y - 0.02, 0]}
        opacity={0.55}
        blur={2.6}
        scale={placement.shadowScale}
        far={4}
        resolution={128}
        frames={1}
      />
    </group>
  );
}

export default memo(FashionModel);
