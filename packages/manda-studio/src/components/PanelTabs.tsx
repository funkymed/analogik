import Activity from "lucide-react/dist/esm/icons/activity.js";
import Flame from "lucide-react/dist/esm/icons/flame.js";
import ImageIcon from "lucide-react/dist/esm/icons/image.js";
import Sparkles from "lucide-react/dist/esm/icons/sparkles.js";
import Type from "lucide-react/dist/esm/icons/type.js";
import Zap from "lucide-react/dist/esm/icons/zap.js";
import ImagePlus from "lucide-react/dist/esm/icons/image-plus.js";
import Clock from "lucide-react/dist/esm/icons/clock.js";
import AlignHorizontalJustifyCenter from "lucide-react/dist/esm/icons/align-horizontal-justify-center.js";
import type { PanelName } from "@/store/useStudioStore.ts";

interface PanelTabsProps {
  activePanel: string;
  onPanelChange: (panel: string) => void;
}

const TABS: { key: PanelName; label: string; icon: typeof Zap }[] = [
  { key: "shader", label: "Shader", icon: Zap },
  { key: "background", label: "Background", icon: ImagePlus },
  { key: "vumeters", label: "Vumeters", icon: Activity },
  { key: "composer", label: "Composer", icon: Sparkles },
  { key: "texts", label: "Texts", icon: Type },
  { key: "images", label: "Images", icon: ImageIcon },
  { key: "sparks", label: "Sparks", icon: Flame },
  { key: "progressbar", label: "Progress Bar", icon: AlignHorizontalJustifyCenter },
  { key: "timecode", label: "Timecode", icon: Clock },
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
