import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Eye from "lucide-react/dist/esm/icons/eye.js";
import EyeOff from "lucide-react/dist/esm/icons/eye-off.js";
import Volume2 from "lucide-react/dist/esm/icons/volume-2.js";
import VolumeX from "lucide-react/dist/esm/icons/volume-x.js";
import Plus from "lucide-react/dist/esm/icons/plus.js";
import Upload from "lucide-react/dist/esm/icons/upload.js";
import X from "lucide-react/dist/esm/icons/x.js";
import { SCENE_COLORS, useGanttStore } from "@/store/useGanttStore.ts";
import { useStudioStore } from "@/store/useStudioStore.ts";
import { useTrackHeights } from "@/hooks/useTrackHeights.ts";
import type { TimelineScene } from "@/timeline/ganttTypes.ts";

const SCENE_ROW_BASE = 40;
const SCENE_LABEL_ROW_HEIGHT = 20;

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
/*  SceneLabelRow — inline scene name + color swatch                  */
/* ------------------------------------------------------------------ */

interface SceneLabelRowProps {
  scene: TimelineScene;
  height: number;
}

function SceneLabelRow({ scene, height }: SceneLabelRowProps) {
  const updateScene = useGanttStore((s) => s.updateScene);
  const selectScene = useGanttStore((s) => s.selectScene);
  const selectedSceneId = useGanttStore((s) => s.selection.sceneId);

  const [editing, setEditing] = useState(false);
  const [nameValue, setNameValue] = useState(scene.name);
  const [showColors, setShowColors] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const colorRef = useRef<HTMLDivElement>(null);

  // Sync name if changed externally
  useEffect(() => {
    if (!editing) setNameValue(scene.name);
  }, [scene.name, editing]);

  // Focus input when editing starts
  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  // Close color picker on outside click
  useEffect(() => {
    if (!showColors) return;
    const handleClick = (e: MouseEvent) => {
      if (colorRef.current && !colorRef.current.contains(e.target as Node)) {
        setShowColors(false);
      }
    };
    document.addEventListener("pointerdown", handleClick);
    return () => document.removeEventListener("pointerdown", handleClick);
  }, [showColors]);

  const commitName = useCallback(() => {
    const trimmed = nameValue.trim();
    if (trimmed && trimmed !== scene.name) {
      updateScene(scene.id, { name: trimmed });
    } else {
      setNameValue(scene.name);
    }
    setEditing(false);
  }, [nameValue, scene.id, scene.name, updateScene]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        commitName();
      } else if (e.key === "Escape") {
        setNameValue(scene.name);
        setEditing(false);
      }
    },
    [commitName, scene.name],
  );

  const handleColorSelect = useCallback(
    (color: string) => {
      updateScene(scene.id, { color });
      setShowColors(false);
    },
    [scene.id, updateScene],
  );

  const isSelected = selectedSceneId === scene.id;

  return (
    <div
      className={`group/scene flex items-center gap-1 px-1.5 ${
        isSelected ? "bg-zinc-800/50" : "hover:bg-zinc-800/30"
      }`}
      style={{ height }}
    >
      {/* Color swatch — click to open picker */}
      <div className="relative" ref={colorRef}>
        <button
          type="button"
          className="h-2.5 w-2.5 shrink-0 rounded-sm border border-white/20 transition-transform hover:scale-125"
          style={{ backgroundColor: scene.color }}
          onClick={() => setShowColors((v) => !v)}
          title="Change color"
        />
        {showColors && (
          <div className="absolute top-full left-0 z-50 mt-1 flex gap-0.5 rounded bg-zinc-900 p-1 shadow-lg ring-1 ring-zinc-700">
            {SCENE_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`h-4 w-4 rounded-sm border transition-transform hover:scale-110 ${
                  c === scene.color
                    ? "border-white ring-1 ring-white/50"
                    : "border-white/20"
                }`}
                style={{ backgroundColor: c }}
                onClick={() => handleColorSelect(c)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Scene name — click to select, double-click to rename */}
      {editing ? (
        <input
          ref={inputRef}
          className="min-w-0 flex-1 rounded bg-zinc-800 px-0.5 text-[9px] text-zinc-300 outline-none ring-1 ring-zinc-600"
          value={nameValue}
          onChange={(e) => setNameValue(e.target.value)}
          onBlur={commitName}
          onKeyDown={handleKeyDown}
        />
      ) : (
        <span
          className="min-w-0 flex-1 cursor-default truncate text-[9px] text-zinc-400"
          title={`${scene.name} — Double-click to rename`}
          onClick={() => selectScene(scene.id)}
          onDoubleClick={() => setEditing(true)}
        >
          {scene.name}
        </span>
      )}
    </div>
  );
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

  const trackHeight = useGanttStore((s) => s.trackHeight);
  const baseRowHeight = Math.round(SCENE_ROW_BASE * trackHeight);

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

            {/* Scene name labels (sorted by startTime) */}
            {trackScenes
              .slice()
              .sort((a, b) => a.startTime - b.startTime)
              .map((scene) => (
                <SceneLabelRow
                  key={scene.id}
                  scene={scene}
                  height={Math.round(SCENE_LABEL_ROW_HEIGHT * trackHeight)}
                />
              ))}

            {/* Parameter path labels for expanded scenes on this track */}
            {trackScenes.map((scene) => {
              const paths = expandedParamsByScene.get(scene.id);
              if (!paths || paths.length === 0) return null;
              return paths.map((path, idx) => {
                const shortPath = path.includes(".") ? path.substring(path.indexOf(".") + 1) : path;
                return (
                  <div
                    key={`${scene.id}-${path}`}
                    className="flex h-6 items-center gap-1 px-1.5"
                  >
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
