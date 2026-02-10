/**
 * Draws an audio waveform on a canvas element.
 * Uses the first channel of the AudioBuffer, downsampled to 1 sample per pixel.
 */
export function drawWaveform(
  canvas: HTMLCanvasElement,
  audioBuffer: AudioBuffer,
  trimStart: number,
  duration: number,
  color: string,
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const { width, height } = canvas;
  ctx.clearRect(0, 0, width, height);

  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  const startSample = Math.floor(trimStart * sampleRate);
  const totalSamples = Math.floor(duration * sampleRate);
  const samplesPerPixel = Math.max(1, Math.floor(totalSamples / width));

  ctx.fillStyle = color;

  const midY = height / 2;

  for (let px = 0; px < width; px++) {
    const sampleStart = startSample + px * samplesPerPixel;
    const sampleEnd = Math.min(sampleStart + samplesPerPixel, channelData.length);

    let peak = 0;
    for (let s = sampleStart; s < sampleEnd; s++) {
      const abs = Math.abs(channelData[s] ?? 0);
      if (abs > peak) peak = abs;
    }

    const barHeight = peak * height;
    ctx.fillRect(px, midY - barHeight / 2, 1, Math.max(1, barHeight));
  }
}
