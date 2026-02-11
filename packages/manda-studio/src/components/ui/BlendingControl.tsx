import { useStudioStore } from "@/store/useStudioStore";
import { useCallback } from "react";

interface BlendingControlProps {
  path: string;
  value: string | undefined;
}

const MODES = ["additive", "normal", "subtractive"] as const;
const LABELS: Record<string, string> = {
  additive: "add",
  normal: "normal",
  subtractive: "sub",
};

export function BlendingControl({ path, value }: BlendingControlProps) {
  const updateConfig = useStudioStore((s) => s.updateConfig);
  const pushHistory = useStudioStore((s) => s.pushHistory);

  const handleClick = useCallback(
    (mode: string) => {
      pushHistory();
      updateConfig(path, mode);
    },
    [pushHistory, updateConfig, path],
  );

  const current = value ?? "normal";

  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-zinc-400">Blending</span>
      <div className="flex gap-0.5">
        {MODES.map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => handleClick(mode)}
            className={`rounded px-2 py-0.5 text-[10px] capitalize transition-colors ${
              current === mode
                ? "bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500"
                : "bg-zinc-800 text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {LABELS[mode]}
          </button>
        ))}
      </div>
    </div>
  );
}
