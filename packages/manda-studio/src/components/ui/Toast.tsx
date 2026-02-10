import { useEffect, useState } from "react";
import { useToastStore } from "@/utils/toast";
import type { ToastItem } from "@/utils/toast";

/* ------------------------------------------------------------------ */
/*  Single toast item with enter/exit animation                       */
/* ------------------------------------------------------------------ */

const borderColorMap: Record<ToastItem["type"], string> = {
  success: "border-l-green-500",
  error: "border-l-red-500",
  info: "border-l-blue-500",
};

function ToastItemView({ item }: { item: ToastItem }) {
  const [visible, setVisible] = useState(false);
  const removeToast = useToastStore((s) => s.removeToast);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className={`flex items-center rounded-lg border border-zinc-700 border-l-4 bg-zinc-800 px-4 py-3 shadow-lg transition-all duration-300 ${borderColorMap[item.type]} ${
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-2 opacity-0"
      }`}
    >
      <span className="text-xs text-zinc-200">{item.message}</span>
      <button
        type="button"
        onClick={() => removeToast(item.id)}
        className="ml-3 text-zinc-500 transition-colors hover:text-zinc-300"
        aria-label="Dismiss"
      >
        &times;
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Container - renders in bottom-right corner                        */
/* ------------------------------------------------------------------ */

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-auto fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
      {toasts.map((t) => (
        <ToastItemView key={t.id} item={t} />
      ))}
    </div>
  );
}
