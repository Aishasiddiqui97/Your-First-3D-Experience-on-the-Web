"use client";

import { memo, useEffect, useRef } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from "react";
import { COLOR_OPTIONS, MATERIAL_OPTIONS } from "@/lib/customization";
import type {
  ColorOptionId,
  MaterialOptionId,
} from "@/lib/customization";

interface CustomizerPanelProps {
  colorId: ColorOptionId;
  materialId: MaterialOptionId;
  wireframe: boolean;
  autoRotate: boolean;
  onColorChange: (id: ColorOptionId) => void;
  onMaterialChange: (id: MaterialOptionId) => void;
  onWireframeChange: (value: boolean) => void;
  onAutoRotateChange: (value: boolean) => void;
  /** Optional content rendered above the panel footer (e.g. the chat launcher). */
  footer?: ReactNode;
}

/**
 * ARIA APG "radio group" keyboard interaction: exactly one radio is in the tab
 * order (the checked one) and Arrow/Home/End keys move focus while selecting.
 */
function useRadioRoving(
  count: number,
  selectedIndex: number,
  onSelect: (index: number) => void,
) {
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const focusIndexRef = useRef(selectedIndex);

  useEffect(() => {
    focusIndexRef.current = selectedIndex;
  }, [selectedIndex]);

  const moveTo = (index: number) => {
    const next = (index + count) % count;
    focusIndexRef.current = next;
    onSelect(next);
    itemRefs.current[next]?.focus();
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        event.preventDefault();
        moveTo(focusIndexRef.current + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        event.preventDefault();
        moveTo(focusIndexRef.current - 1);
        break;
      case "Home":
        event.preventDefault();
        moveTo(0);
        break;
      case "End":
        event.preventDefault();
        moveTo(count - 1);
        break;
      default:
        break;
    }
  };

  return { itemRefs, handleKeyDown };
}

interface ToggleProps {
  label: string;
  active: boolean;
  onChange: (value: boolean) => void;
}

function Toggle({ label, active, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={label}
      onClick={() => onChange(!active)}
      className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left transition-colors hover:border-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal"
    >
      <span className="text-xs font-medium uppercase tracking-[0.2em] text-white/75">
        {label}
      </span>
      <span
        aria-hidden
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
          active ? "bg-teal" : "bg-white/40"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
            active ? "translate-x-[18px]" : "translate-x-0.5"
          }`}
        />
      </span>
    </button>
  );
}

/**
 * Sidebar (desktop: right rail, mobile: bottom sheet) that drives the 3D
 * customizer state. Fully keyboard accessible - native buttons, proper
 * radiogroup/switch semantics and visible focus rings.
 */
function CustomizerPanel({
  colorId,
  materialId,
  wireframe,
  autoRotate,
  onColorChange,
  onMaterialChange,
  onWireframeChange,
  onAutoRotateChange,
  footer,
}: CustomizerPanelProps) {
  const selectedColorIndex = COLOR_OPTIONS.findIndex(
    (option) => option.id === colorId,
  );
  const colorRoving = useRadioRoving(
    COLOR_OPTIONS.length,
    selectedColorIndex,
    (index) => onColorChange(COLOR_OPTIONS[index].id),
  );

  const selectedMaterialIndex = MATERIAL_OPTIONS.findIndex(
    (option) => option.id === materialId,
  );
  const materialRoving = useRadioRoving(
    MATERIAL_OPTIONS.length,
    selectedMaterialIndex,
    (index) => onMaterialChange(MATERIAL_OPTIONS[index].id),
  );

  return (
    <aside
      aria-label="Product customizer"
      className="custom-scroll absolute inset-x-0 bottom-0 z-20 flex max-h-[62dvh] flex-col gap-6 overflow-y-auto border-t border-teal/20 bg-plum/85 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 backdrop-blur-xl md:left-auto md:right-0 md:top-0 md:h-full md:max-h-none md:w-[360px] md:overflow-y-auto md:border-l md:border-t-0 md:px-6"
    >
      <div className="flex w-full items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/85">
          Customize
        </h2>
        <span className="text-[10px] uppercase tracking-[0.2em] text-white/55 md:hidden">
          Drag bag to rotate
        </span>
      </div>

      {/* Color selection */}
      <section aria-label="Color" className="w-full">
        <h3 className="mb-3 text-xs uppercase tracking-[0.25em] text-gold">
          Color
        </h3>
        <div
          role="radiogroup"
          aria-label="Choose product color"
          onKeyDown={colorRoving.handleKeyDown}
          className="flex flex-wrap gap-3"
        >
          {COLOR_OPTIONS.map((option, index) => {
            const selected = option.id === colorId;
            return (
              <button
                key={option.id}
                ref={(el) => {
                  colorRoving.itemRefs.current[index] = el;
                }}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={`${option.label} color`}
                tabIndex={selected ? 0 : -1}
                title={option.label}
                onClick={() => onColorChange(option.id)}
                className={`flex h-11 w-11 items-center justify-center rounded-full border-2 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-plum ${
                  selected
                    ? "scale-105 border-teal"
                    : "border-white/45 hover:scale-105 hover:border-white/70"
                }`}
                style={{ backgroundColor: option.hex }}
              >
                {selected && (
                  <span
                    aria-hidden
                    className="text-sm font-bold text-white drop-shadow"
                  >
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Material finish */}
      <section aria-label="Material" className="w-full">
        <h3 className="mb-3 text-xs uppercase tracking-[0.25em] text-gold">
          Material
        </h3>
        <div
          role="radiogroup"
          aria-label="Choose material finish"
          onKeyDown={materialRoving.handleKeyDown}
          className="grid grid-cols-3 gap-2"
        >
          {MATERIAL_OPTIONS.map((option, index) => {
            const selected = option.id === materialId;
            return (
              <button
                key={option.id}
                ref={(el) => {
                  materialRoving.itemRefs.current[index] = el;
                }}
                type="button"
                role="radio"
                aria-checked={selected}
                tabIndex={selected ? 0 : -1}
                onClick={() => onMaterialChange(option.id)}
                className={`rounded-xl border px-2 py-3 text-xs font-medium uppercase tracking-wider transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal ${
                  selected
                    ? "border-teal bg-teal/10 text-teal"
                    : "border-white/35 text-white/75 hover:border-white/60 hover:text-white/95"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Display toggles */}
      <section aria-label="Display options" className="w-full space-y-3">
        <Toggle
          label="Wireframe mode"
          active={wireframe}
          onChange={onWireframeChange}
        />
        <Toggle
          label="Auto rotate"
          active={autoRotate}
          onChange={onAutoRotateChange}
        />
      </section>

      {footer}

      <div className="mt-auto border-t border-white/10 pt-4 text-[10px] uppercase tracking-[0.2em] text-white/50">
        Powered by React Three Fiber
      </div>
    </aside>
  );
}

export default memo(CustomizerPanel);
