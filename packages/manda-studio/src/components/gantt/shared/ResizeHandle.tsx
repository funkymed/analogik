import { useCallback, useEffect, useRef } from "react";

interface ResizeHandleProps {
  /** "left" or "right" side of the block. */
  side: "left" | "right";
  /** Called continuously during drag with the pixel delta from drag start. */
  onResize: (deltaPx: number) => void;
  /** Called when the resize drag ends. */
  onResizeEnd: () => void;
}

export function ResizeHandle({ side, onResize, onResizeEnd }: ResizeHandleProps) {
  const startXRef = useRef(0);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Cleanup resize listeners on unmount to prevent leaks
  useEffect(() => {
    return () => { cleanupRef.current?.(); };
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();
      startXRef.current = e.clientX;

      const handlePointerMove = (ev: PointerEvent) => {
        const delta = ev.clientX - startXRef.current;
        onResize(delta);
      };

      const handlePointerUp = () => {
        cleanupRef.current = null;
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
        onResizeEnd();
      };

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);

      cleanupRef.current = () => {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
      };
    },
    [onResize, onResizeEnd],
  );

  return (
    <div
      data-no-drag
      onPointerDown={handlePointerDown}
      className={[
        "absolute top-0 z-10 h-full w-1.5 cursor-col-resize opacity-0 transition-opacity hover:opacity-100",
        side === "left" ? "left-0" : "right-0",
      ].join(" ")}
      style={{ backgroundColor: "rgba(255,255,255,0.4)" }}
    />
  );
}
