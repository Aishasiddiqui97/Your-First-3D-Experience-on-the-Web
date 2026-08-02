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

  // Store the new desired look. Reduced-motion users snap instantly instead
  // of animating, so nothing lingers mid-transition.
  const applyTargets = useCallback(() => {
    const preset = MATERIAL_BY_ID[material.id];
    for (const state of materialsRef.current) {
      state.targetColor.copy(colorHex);
      state.targetRoughness = preset.roughness;
      state.targetMetalness = preset.metalness;
      state.targetClearcoat = preset.clearcoat;
      state.targetClearcoatRoughness = preset.clearcoatRoughness;
      state.targetSheen = preset.sheen;

      if (reducedMotion) {
        state.material.color.copy(state.targetColor);
        state.material.roughness = state.targetRoughness;
        state.material.metalness = state.targetMetalness;
        state.material.clearcoat = state.targetClearcoat;
        state.material.clearcoatRoughness = state.targetClearcoatRoughness;
        state.material.sheen = state.targetSheen;
      }
    }
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
   */
  useFrame(() => {
    if (reducedMotion) return;
    const t = 0.09;
    for (const state of materialsRef.current) {
      state.material.color.lerp(state.targetColor, t);
      state.material.roughness = THREE.MathUtils.lerp(
        state.material.roughness,
        state.targetRoughness,
        t,
      );
      state.material.metalness = THREE.MathUtils.lerp(
        state.material.metalness,
        state.targetMetalness,
        t,
      );
      state.material.clearcoat = THREE.MathUtils.lerp(
        state.material.clearcoat,
        state.targetClearcoat,
        t,
      );
      state.material.clearcoatRoughness = THREE.MathUtils.lerp(
        state.material.clearcoatRoughness,
        state.targetClearcoatRoughness,
        t,
      );
      state.material.sheen = THREE.MathUtils.lerp(
        state.material.sheen,
        state.targetSheen,
        t,
      );
    }
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
        resolution={256}
        frames={1}
      />
    </group>
  );
}

export default memo(FashionModel);
