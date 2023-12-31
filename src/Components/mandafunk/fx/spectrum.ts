import { hextoRGB } from "../tools/color.ts";

// function getColor(magnitude: number): string {
//     const r: number = magnitude * 0.95
//     const g: number = magnitude
//     const b: number = magnitude * 0.25

//     return [r, g, b].join(',')
// }

function drawGradiant(
  w: number,
  h: number,
  op: number
): HTMLCanvasElement | null {
  let opacity: string = "ff";
  if (op <= 0.9) {
    opacity = (op * 256).toString(16).split(".")[0];
    if (opacity.length < 2) {
      opacity = "0" + opacity;
    }
  }
  const grdCanvas = document.createElement("canvas");
  grdCanvas.width = w;
  grdCanvas.height = h;
  const ctx = grdCanvas.getContext("2d");
  if (ctx) {
    var gradient = ctx.createLinearGradient(w, 0, w, h);

    gradient.addColorStop(0, `#FF0000${opacity}`);
    gradient.addColorStop(0.25, `#FFFF00${opacity}`);
    gradient.addColorStop(0.5, `#55FF55${opacity}`);
    gradient.addColorStop(1, `#0000FF${opacity}`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    return grdCanvas;
  }
  return null;
}

export const spectrum = function (
  ctx: CanvasRenderingContext2D | null,
  config: any,
  analyser: AnalyserNode
) {
  const speccolor = config.color ? hextoRGB(config.color) : false;
  const bgColor = config.bgColor ? hextoRGB(config.bgColor) : false;
  const opacity = config.opacity ?? 1;
  const nbBar: number = config.bars ?? 255;
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
      ctx.fillStyle = `rgba(${bgColor as string})`;

      ctx.fillRect(0, 0, cW, cH);
    }
  }

  let SPACER_WIDTH = Math.round(cW / nbBar) + 4,
    BAR_WIDTH = SPACER_WIDTH - 1,
    count = 0;

  BAR_WIDTH = BAR_WIDTH < 1 ? 1 : BAR_WIDTH;

  const fb = analyser.frequencyBinCount;
  
  const freqByteData = new Uint8Array(fb);
  analyser.getByteFrequencyData(freqByteData);

  const grdCtx = drawGradiant(cW, cH, opacity);
  for (let i = 0; i < freqByteData.length; i++) {
    let magnitude = freqByteData[i];
    const H = (magnitude / 255) * cH;

    const posY = config.centerSpectrum ? cH / 2 - H / 2 : cH - H;

    if (config.multiColor) {
      // Draw from gradient, color by magnitude
      if (grdCtx) {
        ctx.drawImage(
          grdCtx,
          0,
          posY,
          1,
          1,
          count * SPACER_WIDTH,
          posY,
          BAR_WIDTH,
          H
        );
      }
    } else {
      ctx.fillStyle = `rgba(${speccolor},${opacity ?? 1})`;
      ctx.fillRect(count * SPACER_WIDTH, posY, BAR_WIDTH, H);
    }

    count++;
  }
};
