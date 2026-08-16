"use client";

/**
 * Shown while the 3D canvas chunk and the GLB model are loading.
 * Intentionally dependency-free (no drei/three) so it can be bundled with the
 * small page shell instead of the WebGL runtime.
 */
export default function LoadingFallback() {
  return (
    <div
      role="status"
      className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-5 bg-plum/80 backdrop-blur-sm"
    >
      <div aria-hidden="true" className="relative h-14 w-14">
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-teal/20 border-t-teal" />
        <div className="absolute inset-3 rounded-full bg-gold/20" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-white/80">
          Loading 3D Experience
        </p>
        <p className="mt-1 text-xs text-white/50">
          Preparing the virtual atelier…
        </p>
      </div>
    </div>
  );
}
