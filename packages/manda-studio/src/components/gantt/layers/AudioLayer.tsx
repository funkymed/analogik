import { useCallback, useMemo } from "react";
import { useGanttStore } from "@/store/useGanttStore.ts";
import { AudioClipBlock } from "./AudioClipBlock.tsx";

interface AudioLayerProps {
  pixelsPerSecond: number;
  getAudioBuffer?: (url: string) => AudioBuffer | null;
}

const ROW_BASE_HEIGHT = 36;

export function AudioLayer({ pixelsPerSecond, getAudioBuffer }: AudioLayerProps) {
  const audioClips = useGanttStore((s) => s.timeline.audioClips);
  const updateAudioClip = useGanttStore((s) => s.updateAudioClip);
  const removeAudioClip = useGanttStore((s) => s.removeAudioClip);
  const trackHeight = useGanttStore((s) => s.trackHeight);
  const audioTrackCount = useGanttStore((s) => s.audioTrackCount);

  const clipsByTrack = useMemo(() => {
    const map = new Map<number, typeof audioClips>();
    for (let i = 0; i < audioTrackCount; i++) {
      map.set(i, []);
    }
    for (const clip of audioClips) {
      const list = map.get(clip.trackIndex);
      if (list) {
        list.push(clip);
      } else {
        map.get(0)?.push(clip);
      }
    }
    return map;
  }, [audioClips, audioTrackCount]);

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

  const handleTrackChange = useCallback(
    (clipId: string, newTrackIndex: number) => {
      updateAudioClip(clipId, { trackIndex: newTrackIndex });
    },
    [updateAudioClip],
  );

  const rowHeight = Math.round(ROW_BASE_HEIGHT * trackHeight);

  return (
    <div className="w-full">
      {Array.from({ length: audioTrackCount }, (_, trackIndex) => (
        <div
          key={`audio-track-${trackIndex}`}
          className="relative w-full border-b border-zinc-800/30"
          style={{ height: rowHeight }}
        >
          {(clipsByTrack.get(trackIndex) ?? []).map((clip) => (
            <AudioClipBlock
              key={clip.id}
              clip={clip}
              pixelsPerSecond={pixelsPerSecond}
              trackHeight={trackHeight}
              isSelected={false}
              audioBuffer={getAudioBuffer?.(clip.url) ?? null}
              rowHeight={rowHeight}
              trackCount={audioTrackCount}
              onSelect={() => {}}
              onMove={(t) => handleMove(clip.id, t)}
              onResize={(d) => handleResize(clip.id, d)}
              onToggleMute={() => handleToggleMute(clip.id)}
              onRemove={() => removeAudioClip(clip.id)}
              onTrackChange={(ti) => handleTrackChange(clip.id, ti)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
