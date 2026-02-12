import { useCallback, useMemo, useRef } from "react";
import Eye from "lucide-react/dist/esm/icons/eye.js";
import EyeOff from "lucide-react/dist/esm/icons/eye-off.js";
import GripVertical from "lucide-react/dist/esm/icons/grip-vertical.js";
import Volume2 from "lucide-react/dist/esm/icons/volume-2.js";
import VolumeX from "lucide-react/dist/esm/icons/volume-x.js";
import Plus from "lucide-react/dist/esm/icons/plus.js";
import Upload from "lucide-react/dist/esm/icons/upload.js";
import X from "lucide-react/dist/esm/icons/x.js";
import { useGanttStore } from "@/store/useGanttStore.ts";
import { useStudioStore } from "@/store/useStudioStore.ts";
import { useTrackHeights } from "@/hooks/useTrackHeights.ts";
import type { TimelineScene } from "@/timeline/ganttTypes.ts";

const SCENE_ROW_BASE = 40;
const PARAMETER_ROW_HEIGHT = 24;

const PARAM_COLORS = [
  "bg-indigo-400",
  "bg-cyan-400",
  "bg-pink-400",
  "bg-amber-400",
  "bg-violet-400",
  "bg-emerald-400",
  "bg-rose-400",
  "bg-sky-400",
  "bg-orange-400",
  "bg-teal-400",
];

/** Get the unique keyframe paths for a scene (sorted alphabetically). */
function getParameterPaths(scene: TimelineScene): string[] {
  const paths = new Set<string>();
  for (const seq of scene.sequences) {
    for (const kf of seq.keyframes) {
      paths.add(kf.path);
    }
  }
  return [...paths].sort();
}

/* ------------------------------------------------------------------ */
/*  TrackLabelsPanel                                                   */
/* ------------------------------------------------------------------ */

interface TrackLabelsPanelProps {
  onLoadAudioFile?: (file: File, trackIndex?: number) => void;
}

export function TrackLabelsPanel({ onLoadAudioFile }: TrackLabelsPanelProps) {
  const sceneTrackCount = useGanttStore((s) => s.sceneTrackCount);
  const audioTrackCount = useGanttStore((s) => s.audioTrackCount);
  const addSceneTrack = useGanttStore((s) => s.addSceneTrack);
  const removeSceneTrack = useGanttStore((s) => s.removeSceneTrack);
  const addAudioTrack = useGanttStore((s) => s.addAudioTrack);
  const removeAudioTrack = useGanttStore((s) => s.removeAudioTrack);
  const addScene = useGanttStore((s) => s.addScene);
  const updateScene = useGanttStore((s) => s.updateScene);
  const scenes = useGanttStore((s) => s.timeline.scenes);
  const audioClips = useGanttStore((s) => s.timeline.audioClips);
  const mutedAudioTracks = useGanttStore((s) => s.mutedAudioTracks);
  const toggleAudioTrackMuted = useGanttStore((s) => s.toggleAudioTrackMuted);
  const swapSceneTracks = useGanttStore((s) => s.swapSceneTracks);
  const config = useStudioStore((s) => s.config);

  const { sceneTrackHeights, audioTrackHeights } = useTrackHeights();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingAudioTrackRef = useRef<number>(0);

  const handleUploadClick = useCallback((trackIndex: number) => {
    pendingAudioTrackRef.current = trackIndex;
    fileInputRef.current?.click();
  }, []);

  const handleAudioFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      onLoadAudioFile?.(file, pendingAudioTrackRef.current);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [onLoadAudioFile],
  );

  const handleAddScene = useCallback(
    (trackIndex: number) => {
      addScene(config, undefined, trackIndex);
    },
    [addScene, config],
  );

  const trackHeight = useGanttStore((s) => s.trackHeight);
  const baseRowHeight = Math.round(SCENE_ROW_BASE * trackHeight);

  const trackDragRef = useRef<{ sourceIndex: number; clientY: number } | null>(null);

  const handleTrackDragStart = useCallback(
    (e: React.PointerEvent, sourceIndex: number) => {
      e.preventDefault();
      trackDragRef.current = { sourceIndex, clientY: e.clientY };

      const handlePointerMove = (ev: PointerEvent) => {
        if (!trackDragRef.current) return;
        const deltaY = ev.clientY - trackDragRef.current.clientY;
        // Compute which track the pointer is over
        let startY = 0;
        for (let i = 0; i < trackDragRef.current.sourceIndex; i++) {
          startY += sceneTrackHeights[i] ?? baseRowHeight;
        }
        const midY = startY + (sceneTrackHeights[trackDragRef.current.sourceIndex] ?? baseRowHeight) / 2 + deltaY;
        let cumY = 0;
        let target = 0;
        for (let i = 0; i < sceneTrackCount; i++) {
          const h = sceneTrackHeights[i] ?? baseRowHeight;
          if (midY < cumY + h) { target = i; break; }
          cumY += h;
          target = i;
        }
        target = Math.max(0, Math.min(sceneTrackCount - 1, target));
        if (target !== trackDragRef.current.sourceIndex) {
          swapSceneTracks(trackDragRef.current.sourceIndex, target);
          trackDragRef.current.sourceIndex = target;
          trackDragRef.current.clientY = ev.clientY;
        }
      };

      const handlePointerUp = () => {
        trackDragRef.current = null;
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
      };

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    },
    [sceneTrackHeights, sceneTrackCount, swapSceneTracks, baseRowHeight],
  );

  const canRemoveSceneTrack = useCallback(
    (index: number) => {
      if (sceneTrackCount <= 1) return false;
      return !scenes.some((s) => s.trackIndex === index);
    },
    [sceneTrackCount, scenes],
  );

  const canRemoveAudioTrack = useCallback(
    (index: number) => {
      if (audioTrackCount <= 1) return false;
      return !audioClips.some((c) => c.trackIndex === index);
    },
    [audioTrackCount, audioClips],
  );

  // Check if all scenes on a track are hidden
  const isSceneTrackHidden = useCallback(
    (trackIndex: number) => {
      const trackScenes = scenes.filter((s) => s.trackIndex === trackIndex);
      return trackScenes.length > 0 && trackScenes.every((s) => s.hidden);
    },
    [scenes],
  );

  const toggleSceneTrackVisibility = useCallback(
    (trackIndex: number) => {
      const trackScenes = scenes.filter((s) => s.trackIndex === trackIndex);
      const allHidden = trackScenes.length > 0 && trackScenes.every((s) => s.hidden);
      for (const scene of trackScenes) {
        updateScene(scene.id, { hidden: !allHidden });
      }
    },
    [scenes, updateScene],
  );

  const paramRowHeight = Math.round(PARAMETER_ROW_HEIGHT * trackHeight);

  // Pre-compute parameter paths per expanded scene
  const expandedParamsByScene = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const scene of scenes) {
      if (!scene.collapsed) {
        map.set(scene.id, getParameterPaths(scene));
      }
    }
    return map;
  }, [scenes]);

  return (
    <div className="flex shrink-0 flex-col">
      {/* Scene tracks */}
      {Array.from({ length: sceneTrackCount }, (_, i) => {
        const trackHidden = isSceneTrackHidden(i);
        const hasScenes = scenes.some((s) => s.trackIndex === i);
        const trackScenes = scenes.filter((s) => s.trackIndex === i);

        return (
          <div
            key={`scene-${i}`}
            className="flex flex-col border-b border-zinc-800/30"
            style={{ height: sceneTrackHeights[i] }}
          >
            {/* Header row: S1 label + controls */}
            <div
              className="group flex shrink-0 items-center justify-between px-1.5"
              style={{ height: baseRowHeight }}
            >
              <div className="flex items-center gap-1">
                {sceneTrackCount > 1 && (
                  <span
                    onPointerDown={(e) => handleTrackDragStart(e, i)}
                    className="cursor-grab text-zinc-600 hover:text-zinc-400 active:cursor-grabbing"
                  >
                    <GripVertical size={10} />
                  </span>
                )}
                <span className="text-[10px] font-medium text-zinc-500">
                  S{i + 1}
                </span>
                {/* Eye icon: toggle visibility of all scenes on this track */}
                {hasScenes && (
                  <button
                    type="button"
                    onClick={() => toggleSceneTrackVisibility(i)}
                    className={`rounded p-0.5 transition-colors ${
                      trackHidden
                        ? "text-zinc-600 hover:text-zinc-400"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                    title={trackHidden ? "Show scenes" : "Hide scenes"}
                  >
                    {trackHidden ? <EyeOff size={10} /> : <Eye size={10} />}
                  </button>
                )}
                {/* Add scene on this track */}
                <button
                  type="button"
                  onClick={() => handleAddScene(i)}
                  className="hidden rounded p-0.5 text-zinc-600 hover:bg-zinc-800 hover:text-zinc-400 group-hover:block"
                  title={`Add scene on track ${i + 1}`}
                >
                  <Plus size={9} />
                </button>
              </div>
              <div className="flex items-center gap-0.5">
                {canRemoveSceneTrack(i) && (
                  <button
                    type="button"
                    onClick={() => removeSceneTrack(i)}
                    className="hidden rounded p-0.5 text-zinc-600 hover:bg-zinc-800 hover:text-zinc-400 group-hover:block"
                    title={`Remove Scene track ${i + 1}`}
                  >
                    <X size={10} />
                  </button>
                )}
                {/* Add new track button on last row */}
                {i === sceneTrackCount - 1 && (
                  <button
                    type="button"
                    onClick={addSceneTrack}
                    className="hidden rounded p-0.5 text-indigo-500/60 hover:bg-zinc-800 hover:text-indigo-400 group-hover:block"
                    title="Add scene track"
                  >
                    <Plus size={10} />
                  </button>
                )}
              </div>
            </div>

            {/* Parameter path labels for expanded scenes on this track */}
            {trackScenes.map((scene) => {
              const paths = expandedParamsByScene.get(scene.id);
              if (!paths || paths.length === 0) return null;
              return paths.map((path, idx) => {
                const shortPath = path.includes(".") ? path.substring(path.indexOf(".") + 1) : path;
                return (
                  <div
                    key={`${scene.id}-${path}`}
                    className="flex items-center gap-1 px-1.5"
                    style={{ height: paramRowHeight }}
                  >
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: scene.color }} />
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-sm ${PARAM_COLORS[idx % PARAM_COLORS.length]}`} />
                    <span className="truncate text-[9px] text-zinc-500" title={path}>
                      {shortPath}
                    </span>
                  </div>
                );
              });
            })}
          </div>
        );
      })}

      {/* Separator between scene and audio sections — matches viewport separator */}
      <div className="border-t border-zinc-700/50" />

      {/* Audio tracks */}
      {Array.from({ length: audioTrackCount }, (_, i) => {
        const isMuted = mutedAudioTracks.has(i);

        return (
          <div
            key={`audio-${i}`}
            className="group flex items-center justify-between border-b border-zinc-800/30 px-1.5"
            style={{ height: audioTrackHeights[i] }}
          >
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-medium text-zinc-500">
                A{i + 1}
              </span>
              {/* Mute/unmute toggle */}
              <button
                type="button"
                onClick={() => toggleAudioTrackMuted(i)}
                className={`rounded p-0.5 transition-colors ${
                  isMuted
                    ? "text-red-500/70 hover:text-red-400"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
                title={isMuted ? "Unmute track" : "Mute track"}
              >
                {isMuted ? <VolumeX size={10} /> : <Volume2 size={10} />}
              </button>
              {/* Upload audio on this specific track */}
              <button
                type="button"
                onClick={() => handleUploadClick(i)}
                className="hidden rounded p-0.5 text-zinc-600 hover:bg-zinc-800 hover:text-zinc-400 group-hover:block"
                title={`Import audio on track ${i + 1}`}
              >
                <Upload size={9} />
              </button>
            </div>
            <div className="flex items-center gap-0.5">
              {canRemoveAudioTrack(i) && (
                <button
                  type="button"
                  onClick={() => removeAudioTrack(i)}
                  className="hidden rounded p-0.5 text-zinc-600 hover:bg-zinc-800 hover:text-zinc-400 group-hover:block"
                  title={`Remove Audio track ${i + 1}`}
                >
                  <X size={10} />
                </button>
              )}
              {/* Add new track button on last row */}
              {i === audioTrackCount - 1 && (
                <button
                  type="button"
                  onClick={addAudioTrack}
                  className="hidden rounded p-0.5 text-emerald-500/60 hover:bg-zinc-800 hover:text-emerald-400 group-hover:block"
                  title="Add audio track"
                >
                  <Plus size={10} />
                </button>
              )}
            </div>
          </div>
        );
      })}

      {/* Hidden file input for audio uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={handleAudioFileChange}
      />
    </div>
  );
}
