import { useCallback, useMemo, useRef, useState } from "react";
import Pause from "lucide-react/dist/esm/icons/pause.js";
import Play from "lucide-react/dist/esm/icons/play.js";
import Volume2 from "lucide-react/dist/esm/icons/volume-2.js";
import VolumeX from "lucide-react/dist/esm/icons/volume-x.js";
import * as Slider from "@radix-ui/react-slider";
import { formatTime } from "@/utils/formatTime.ts";
import { useGanttStore } from "@/store/useGanttStore.ts";

interface PlayerControlsProps {
  className?: string;
}

export function PlayerControls({
  className = "",
}: PlayerControlsProps) {
  const isPlaying = useGanttStore((s) => s.isPlaying);
  const currentTime = useGanttStore((s) => s.currentTime);
  const duration = useGanttStore((s) => s.getTimelineDuration());
  const volume = useGanttStore((s) => s.masterVolume);
  const setPlaying = useGanttStore((s) => s.setPlaying);
  const setCurrentTime = useGanttStore((s) => s.setCurrentTime);
  const setMasterVolume = useGanttStore((s) => s.setMasterVolume);
  const audioClips = useGanttStore((s) => s.timeline.audioClips);

  const [isMuted, setIsMuted] = useState(false);
  const volumeBeforeMuteRef = useRef(volume);

  const handlePlayPause = useCallback(() => {
    setPlaying(!isPlaying);
  }, [isPlaying, setPlaying]);

  const handleMuteToggle = useCallback(() => {
    if (isMuted) {
      setMasterVolume(volumeBeforeMuteRef.current);
      setIsMuted(false);
    } else {
      volumeBeforeMuteRef.current = volume;
      setMasterVolume(0);
      setIsMuted(true);
    }
  }, [isMuted, volume, setMasterVolume]);

  const handleSeek = useCallback(
    (values: number[]) => {
      setCurrentTime(values[0]);
    },
    [setCurrentTime],
  );

  const handleVolumeChange = useCallback(
    (values: number[]) => {
      const newVolume = values[0];
      setMasterVolume(newVolume);
      if (newVolume > 0 && isMuted) {
        setIsMuted(false);
      }
    },
    [setMasterVolume, isMuted],
  );

  // Build a display string for active audio clips
  const activeClipNames = useMemo(
    () => audioClips.filter((c) => !c.muted).map((c) => c.name).join(", "),
    [audioClips],
  );

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className={`flex h-14 shrink-0 items-center gap-4 border-t border-zinc-800 bg-zinc-900 px-4 ${className}`}
    >
      {/* Transport buttons */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={handlePlayPause}
          className="rounded p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>

        {activeClipNames && (
          <span className="ml-1 max-w-[200px] truncate text-xs text-zinc-500" title={activeClipNames}>
            {activeClipNames}
          </span>
        )}
      </div>

      {/* Progress slider */}
      <div className="flex flex-1 items-center gap-3">
        <span className="w-10 text-right font-mono text-xs text-zinc-500">
          {formatTime(currentTime)}
        </span>

        <Slider.Root
          className="relative flex flex-1 touch-none select-none items-center"
          value={[progressPercent]}
          max={100}
          step={0.1}
          onValueChange={(values) => {
            if (duration > 0) {
              handleSeek([(values[0] / 100) * duration]);
            }
          }}
          aria-label="Track progress"
        >
          <Slider.Track className="relative h-1 flex-1 rounded-full bg-zinc-700">
            <Slider.Range className="absolute h-full rounded-full bg-indigo-500" />
          </Slider.Track>
          <Slider.Thumb className="block h-3 w-3 rounded-full bg-white shadow-md transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500" />
        </Slider.Root>

        <span className="w-10 font-mono text-xs text-zinc-500">
          {formatTime(duration)}
        </span>
      </div>

      {/* Volume control */}
      <div className="flex w-28 items-center gap-2">
        <button
          type="button"
          onClick={handleMuteToggle}
          className="shrink-0 text-zinc-400 transition-colors hover:text-white"
          aria-label={isMuted || volume === 0 ? "Unmute" : "Mute"}
        >
          {isMuted || volume === 0 ? (
            <VolumeX size={14} />
          ) : (
            <Volume2 size={14} />
          )}
        </button>

        <Slider.Root
          className="relative flex flex-1 touch-none select-none items-center"
          value={[isMuted ? 0 : volume]}
          max={1}
          step={0.01}
          onValueChange={handleVolumeChange}
          aria-label="Volume"
        >
          <Slider.Track className="relative h-1 flex-1 rounded-full bg-zinc-700">
            <Slider.Range className="absolute h-full rounded-full bg-indigo-500" />
          </Slider.Track>
          <Slider.Thumb className="block h-2.5 w-2.5 rounded-full bg-white shadow-md transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500" />
        </Slider.Root>
      </div>
    </div>
  );
}
