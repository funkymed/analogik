import { useCallback, useRef } from "react";
import Plus from "lucide-react/dist/esm/icons/plus.js";
import Upload from "lucide-react/dist/esm/icons/upload.js";
import X from "lucide-react/dist/esm/icons/x.js";
import { useGanttStore } from "@/store/useGanttStore.ts";
import { useStudioStore } from "@/store/useStudioStore.ts";
import { useTrackHeights } from "@/hooks/useTrackHeights.ts";

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
  const scenes = useGanttStore((s) => s.timeline.scenes);
  const audioClips = useGanttStore((s) => s.timeline.audioClips);
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

  return (
    <div className="flex shrink-0 flex-col">
      {/* Scene tracks */}
      {Array.from({ length: sceneTrackCount }, (_, i) => (
        <div
          key={`scene-${i}`}
          className="group flex items-start justify-between border-b border-zinc-800/30 px-1.5 pt-2"
          style={{ height: sceneTrackHeights[i] }}
        >
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-medium text-zinc-500">
              S{i + 1}
            </span>
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
      ))}

      {/* Separator between scene and audio sections — matches viewport separator */}
      <div className="border-t border-zinc-700/50" />

      {/* Audio tracks */}
      {Array.from({ length: audioTrackCount }, (_, i) => (
        <div
          key={`audio-${i}`}
          className="group flex items-center justify-between border-b border-zinc-800/30 px-1.5"
          style={{ height: audioTrackHeights[i] }}
        >
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-medium text-zinc-500">
              A{i + 1}
            </span>
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
      ))}

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
