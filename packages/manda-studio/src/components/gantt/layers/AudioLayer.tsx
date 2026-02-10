import { useCallback, useRef } from "react";
import { Plus } from "lucide-react";
import { useGanttStore } from "@/store/useGanttStore.ts";
import { AudioClipBlock } from "./AudioClipBlock.tsx";

interface AudioLayerProps {
  pixelsPerSecond: number;
  onLoadAudioFile?: (file: File) => void;
  getAudioBuffer?: (url: string) => AudioBuffer | null;
}

export function AudioLayer({ pixelsPerSecond, onLoadAudioFile, getAudioBuffer }: AudioLayerProps) {
  const audioClips = useGanttStore((s) => s.timeline.audioClips);
  const updateAudioClip = useGanttStore((s) => s.updateAudioClip);
  const removeAudioClip = useGanttStore((s) => s.removeAudioClip);
  const trackHeight = useGanttStore((s) => s.trackHeight);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      onLoadAudioFile?.(file);
      // Reset so the same file can be re-selected
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [onLoadAudioFile],
  );

  const handleMove = useCallback(
    (clipId: string, newStartTime: number) => {
      const snapped = useGanttStore.getState().snapTime(newStartTime);
      updateAudioClip(clipId, { startTime: Math.max(0, snapped) });
    },
    [updateAudioClip],
  );

  const handleResize = useCallback(
    (clipId: string, newDuration: number) => {
      updateAudioClip(clipId, { duration: newDuration });
    },
    [updateAudioClip],
  );

  const handleToggleMute = useCallback(
    (clipId: string) => {
      const clip = audioClips.find((c) => c.id === clipId);
      if (clip) {
        updateAudioClip(clipId, { muted: !clip.muted });
      }
    },
    [audioClips, updateAudioClip],
  );

  return (
    <div className="relative w-full border-t border-zinc-800/50" style={{ height: Math.round(36 * trackHeight) }}>
      {/* Layer label + add button */}
      <div className="absolute -left-0 top-0 flex items-center gap-1 pl-1" style={{ height: Math.round(36 * trackHeight) }}>
        <span className="text-[10px] font-medium text-zinc-500">Audio</span>
        <button
          type="button"
          onClick={handleAddClick}
          className="rounded p-0.5 text-zinc-600 hover:bg-zinc-800 hover:text-zinc-400"
          title="Add audio clip"
        >
          <Plus size={10} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Audio clip blocks */}
      {audioClips.map((clip) => (
        <AudioClipBlock
          key={clip.id}
          clip={clip}
          pixelsPerSecond={pixelsPerSecond}
          trackHeight={trackHeight}
          isSelected={false}
          audioBuffer={getAudioBuffer?.(clip.url) ?? null}
          onSelect={() => {}}
          onMove={(t) => handleMove(clip.id, t)}
          onResize={(d) => handleResize(clip.id, d)}
          onToggleMute={() => handleToggleMute(clip.id)}
          onRemove={() => removeAudioClip(clip.id)}
        />
      ))}
    </div>
  );
}
