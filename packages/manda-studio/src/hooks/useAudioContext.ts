import { useEffect, useRef, useState } from "react";

export interface UseAudioContextReturn {
  audioContext: AudioContext | null;
  analyserNode: AnalyserNode | null;
}

/**
 * Minimal hook that creates and owns a shared AudioContext + AnalyserNode.
 * Resumes the context on the first user gesture automatically.
 */
export function useAudioContext(): UseAudioContextReturn {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.8;
    analyser.connect(ctx.destination);

    ctxRef.current = ctx;
    setAudioContext(ctx);
    setAnalyserNode(analyser);

    // Resume on first user gesture if suspended
    const resume = () => {
      if (ctx.state === "suspended") {
        void ctx.resume();
      }
      window.removeEventListener("click", resume);
      window.removeEventListener("keydown", resume);
    };
    window.addEventListener("click", resume, { once: true });
    window.addEventListener("keydown", resume, { once: true });

    return () => {
      window.removeEventListener("click", resume);
      window.removeEventListener("keydown", resume);
      analyser.disconnect();
      void ctx.close();
      ctxRef.current = null;
    };
  }, []);

  return { audioContext, analyserNode };
}
