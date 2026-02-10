import { useState, useCallback } from "react";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down.js";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right.js";

interface SectionHeaderProps {
  title: string;
  enabled?: boolean;
  onToggle?: (enabled: boolean) => void;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function SectionHeader({
  title,
  enabled,
  onToggle,
  defaultOpen = true,
  children,
}: SectionHeaderProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const handleToggleOpen = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleToggleEnabled = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggle?.(!enabled);
    },
    [enabled, onToggle],
  );

  return (
    <div className="border-b border-zinc-800">
      <button
        type="button"
        onClick={handleToggleOpen}
        className="flex w-full items-center gap-1.5 px-1 py-2 text-left"
      >
        {isOpen ? (
          <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-zinc-500" />
        )}
        <span className="flex-1 text-xs font-medium text-zinc-300">
          {title}
        </span>
        {onToggle !== undefined && (
          <span
            role="switch"
            aria-checked={enabled}
            onClick={handleToggleEnabled}
            className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
              enabled ? "bg-indigo-500" : "bg-zinc-700"
            }`}
          >
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full bg-white shadow transition-transform ${
                enabled ? "translate-x-[14px]" : "translate-x-[3px]"
              }`}
            />
          </span>
        )}
      </button>
      {isOpen && <div className="space-y-3 px-1 pb-3">{children}</div>}
    </div>
  );
}
