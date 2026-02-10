import Activity from "lucide-react/dist/esm/icons/activity.js";
import Image from "lucide-react/dist/esm/icons/image.js";
import Layers from "lucide-react/dist/esm/icons/layers.js";
import Sparkles from "lucide-react/dist/esm/icons/sparkles.js";
import Type from "lucide-react/dist/esm/icons/type.js";
import type { PanelName } from "@/store/useStudioStore.ts";

interface PanelTabsProps {
  activePanel: string;
  onPanelChange: (panel: string) => void;
}

const TABS: { key: PanelName; label: string; icon: typeof Layers }[] = [
  { key: "scene", label: "Scene", icon: Layers },
  { key: "vumeters", label: "Vumeters", icon: Activity },
  { key: "composer", label: "Composer", icon: Sparkles },
  { key: "texts", label: "Texts", icon: Type },
  { key: "images", label: "Images", icon: Image },
];

export function PanelTabs({ activePanel, onPanelChange }: PanelTabsProps) {
  return (
    <nav className="flex w-full flex-col">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activePanel === tab.key;

        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onPanelChange(tab.key)}
            className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
              isActive
                ? "border-l-2 border-indigo-500 bg-zinc-800 text-indigo-400"
                : "border-l-2 border-transparent text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300"
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon size={16} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
