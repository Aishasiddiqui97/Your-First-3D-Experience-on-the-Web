import { useEffect, useState } from "react";

/**
 * Shared domain types + static option data for the product customizer.
 *
 * NOTE: this module deliberately does NOT import `three` so it can be bundled
 * into the small, non-3D UI chunks (page + panel) without pulling the WebGL
 * runtime into the critical path. Colors are stored as plain hex strings and
 * converted to THREE.Color inside the lazy-loaded scene.
 */

export type ColorOptionId = "emerald" | "gold" | "black" | "white";

export interface ColorOption {
  id: ColorOptionId;
  label: string;
  /** CSS hex used by the UI swatches. */
  hex: string;
}

export const COLOR_OPTIONS: ColorOption[] = [
  { id: "emerald", label: "Emerald Green", hex: "#00A86B" },
  { id: "gold", label: "Gold", hex: "#C8A24A" },
  { id: "black", label: "Black", hex: "#111114" },
  { id: "white", label: "White", hex: "#F4F4F4" },
];

export type MaterialOptionId = "fabric" | "silk" | "metallic";

export interface MaterialOption {
  id: MaterialOptionId;
  label: string;
  /** Target values the animation interpolates towards (see FashionModel). */
  roughness: number;
  metalness: number;
  clearcoat: number;
  clearcoatRoughness: number;
  sheen: number;
}

export const MATERIAL_OPTIONS: MaterialOption[] = [
  { id: "fabric", label: "Fabric", roughness: 0.9, metalness: 0.0, clearcoat: 0, clearcoatRoughness: 0.2, sheen: 0 },
  { id: "silk", label: "Silk", roughness: 0.28, metalness: 0.0, clearcoat: 1, clearcoatRoughness: 0.08, sheen: 0.6 },
  { id: "metallic", label: "Metallic", roughness: 0.22, metalness: 1.0, clearcoat: 0, clearcoatRoughness: 0, sheen: 0 },
];

/** Fast lookups by id. */
export const COLOR_BY_ID: Record<ColorOptionId, ColorOption> = Object.fromEntries(
  COLOR_OPTIONS.map((c) => [c.id, c]),
) as Record<ColorOptionId, ColorOption>;

export const MATERIAL_BY_ID: Record<MaterialOptionId, MaterialOption> = Object.fromEntries(
  MATERIAL_OPTIONS.map((m) => [m.id, m]),
) as Record<MaterialOptionId, MaterialOption>;

/**
 * Tracks the user's `prefers-reduced-motion` preference.
 *
 * Starts as `false` (matching SSR) and syncs in an effect, which avoids a
 * hydration mismatch between the server and the client's first render.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return reduced;
}
