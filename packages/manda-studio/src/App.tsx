import { lazy, Suspense, useCallback, useEffect, useRef } from "react";
import { useStudioStore } from "@/store/useStudioStore.ts";
import { useGanttStore } from "@/store/useGanttStore.ts";
import { seedSamplePresets } from "@/db/samplePresets";
import { useAudioContext } from "@/hooks/useAudioContext.ts";
import { useFps } from "@/hooks/useFps.ts";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts.ts";
import { useThumbnailCapture } from "@/hooks/useThumbnailCapture.ts";
import { PreviewCanvas } from "@/components/PreviewCanvas.tsx";
import { PlayerControls } from "@/components/PlayerControls.tsx";
import { PanelTabs } from "@/components/PanelTabs.tsx";
import { StatusBar } from "@/components/StatusBar.tsx";
import { ShaderPanel } from "@/components/panels/ShaderPanel.tsx";
import { BackgroundPanel } from "@/components/panels/BackgroundPanel.tsx";
import { VumetersPanel } from "@/components/panels/VumetersPanel.tsx";
import { ComposerPanel } from "@/components/panels/ComposerPanel.tsx";
import { TextsImagesPanel } from "@/components/panels/TextsImagesPanel.tsx";
import { SparksPanel } from "@/components/panels/SparksPanel.tsx";
import { ProgressBarPanel } from "@/components/panels/ProgressBarPanel.tsx";
import { TimecodePanel } from "@/components/panels/TimecodePanel.tsx";
import { GanttTimeline } from "@/components/gantt/GanttTimeline.tsx";
import { useGanttBridge } from "@/hooks/useGanttBridge.ts";
import { usePlaybackEngine } from "@/hooks/usePlaybackEngine.ts";
import { ToastContainer } from "@/components/ui/Toast.tsx";
import BookOpen from "lucide-react/dist/esm/icons/book-open.js";

// Lazy-loaded components (conditionally rendered drawers/modals)
const LibraryDrawer = lazy(() =>
  import("@/components/library/LibraryDrawer.tsx").then((m) => ({ default: m.LibraryDrawer })),
);
const KeyboardShortcutsHelp = lazy(() =>
  import("@/components/ui/KeyboardShortcutsHelp.tsx").then((m) => ({ default: m.KeyboardShortcutsHelp })),
);

function App() {
  const activePanel = useStudioStore((s) => s.activePanel);
  const setActivePanel = useStudioStore((s) => s.setActivePanel);
  const config = useStudioStore((s) => s.config);
  const setCaptureThumbnail = useStudioStore((s) => s.setCaptureThumbnail);

  const libraryOpen = useStudioStore((s) => s.libraryOpen);
  const setLibraryOpen = useStudioStore((s) => s.setLibraryOpen);

  const { audioContext, analyserNode } = useAudioContext();

  const isPlaying = useGanttStore((s) => s.isPlaying);
  const fps = useFps(isPlaying);
  const { setCanvas: setPreviewCanvas, capture: captureThumbnail } =
    useThumbnailCapture();

  useKeyboardShortcuts();
  useGanttBridge();

  const { setRenderer: setPlaybackRenderer, addAudioFile, getAudioBuffer, loadAudioClipBuffer } =
    usePlaybackEngine(audioContext, analyserNode);

  // Seed sample presets on first launch
  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    void seedSamplePresets();
  }, []);

  // Store the capture function in the global store so library UI can use it.
  useEffect(() => {
    setCaptureThumbnail(captureThumbnail);
    return () => setCaptureThumbnail(null);
  }, [captureThumbnail, setCaptureThumbnail]);

  const handlePanelChange = useCallback(
    (panel: string) => {
      setActivePanel(panel as typeof activePanel);
    },
    [setActivePanel],
  );

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="flex h-10 shrink-0 items-center justify-between border-b border-zinc-800 px-4">
        <h1 className="text-sm font-semibold tracking-wide text-zinc-300">
          MandaStudio
        </h1>
        <button
          type="button"
          onClick={() => setLibraryOpen(true)}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
          title="Open Library"
        >
          <BookOpen size={14} />
          Library
        </button>
      </header>

      {/* Main content */}
      <div className="flex min-h-0 flex-1">
        {/* Left sidebar */}
        <aside className="flex w-72 shrink-0 flex-col border-r border-zinc-800">
          <PanelTabs
            activePanel={activePanel}
            onPanelChange={handlePanelChange}
          />

          <div className="flex-1 overflow-y-auto p-3">
            {activePanel === "shader" && <ShaderPanel />}
            {activePanel === "background" && <BackgroundPanel />}
            {activePanel === "vumeters" && <VumetersPanel />}
            {activePanel === "composer" && <ComposerPanel />}
            {activePanel === "texts" && <TextsImagesPanel panelType="texts" />}
            {activePanel === "images" && <TextsImagesPanel panelType="images" />}
            {activePanel === "sparks" && <SparksPanel />}
            {activePanel === "progressbar" && <ProgressBarPanel />}
            {activePanel === "timecode" && <TimecodePanel />}
          </div>
        </aside>

        {/* Right area: preview + player */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <PreviewCanvas
            className="flex-1"
            audioContext={audioContext}
            analyserNode={analyserNode}
            config={config}
            onRendererReady={setPlaybackRenderer}
            onCanvasReady={setPreviewCanvas}
          />

          <GanttTimeline onLoadAudioFile={addAudioFile} getAudioBuffer={getAudioBuffer} />

          <PlayerControls />
        </div>
      </div>

      {/* Status bar */}
      <StatusBar
        shaderName={config.scene.shader || undefined}
        fps={fps}
      />
      <Suspense fallback={null}>
        <LibraryDrawer open={libraryOpen} onClose={() => setLibraryOpen(false)} loadAudioClipBuffer={loadAudioClipBuffer} />
        <KeyboardShortcutsHelp />
      </Suspense>
      <ToastContainer />
    </div>
  );
}

export default App;
