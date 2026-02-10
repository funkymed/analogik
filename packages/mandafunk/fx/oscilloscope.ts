import { hextoRGB } from "../tools/color";

/**
 * Renders an oscilloscope (waveform) visualization onto a 2D canvas context.
 * Draws the audio time-domain data as connected line segments.
 *
 * @param ctx - The 2D canvas rendering context to draw on
 * @param config - Oscilloscope configuration (color, bgColor, opacity, motionBlur, etc.)
 * @param analyser - Web Audio API AnalyserNode providing time-domain audio data
 */
export const oscillo = function (
  ctx: CanvasRenderingContext2D | null,
  config: any,
  analyser: AnalyserNode
) {
  const oscillocolor: string | boolean = config.color
    ? hextoRGB(config.color)
    : false;
  const bgColor: string | boolean = config.bgColor;
  const opacity: number = config.opacity ?? 1;

  if (!ctx) {
    return;
  }
  const cW = ctx.canvas.width;
  const cH = ctx.canvas.height;

  if (config.motionBlur) {
    ctx.fillStyle = `rgba(0,0,0,${config.motionBlurLength})`;
    ctx.fillRect(0, 0, cW, cH);
  } else {
    ctx.clearRect(0, 0, cW, cH);
    if (bgColor) {
      ctx.fillStyle = bgColor as string;
      ctx.fillRect(0, 0, cW, cH);
    }
  }

  ctx.fillStyle = `rgba(${oscillocolor},${opacity ?? 1})`;

  const fb = analyser.frequencyBinCount;
  const freqByteData = new Uint8Array(fb);
  analyser.getByteTimeDomainData(freqByteData);

  ctx.lineWidth = 2;
  ctx.strokeStyle = `rgba(${oscillocolor},${opacity ?? 1})`;

  const threshold = 2;
  const maxValue = 256 / threshold;

  for (let i = 0; i < fb; i++) {
    const value_old = freqByteData[i - 1] / threshold;

    const percent_old: number = value_old / maxValue;
    const height_old: number = cH * percent_old;
    const offset_old: number = cH - height_old - 1;
    const barWidth_old: number = cW / analyser.frequencyBinCount;

    const value: number = freqByteData[i] / threshold;
    const percent: number = value / maxValue;
    const height: number = cH * percent;
    const offset: number = cH - height - 1;
    const barWidth: number = cW / analyser.frequencyBinCount;

    ctx.beginPath();
    ctx.moveTo((i - 1) * barWidth_old, offset_old);
    ctx.lineTo(i * barWidth, offset);
    ctx.stroke();
  }
};
