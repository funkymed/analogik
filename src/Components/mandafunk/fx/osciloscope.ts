import { hextoRGB } from '../tools/color.ts'

export const oscillo = function (
    ctx: CanvasRenderingContext2D | null,
    config: any,
    analyser: AnalyserNode
) {
    const oscillocolor: string | boolean = config.color ? hextoRGB(config.color) : false
    const bgColor: string | boolean = config.bgColor
    const opacity: number = config.opacity ?? 1

    if (!ctx) {
        return
    }
    const cW = ctx.canvas.width
    const cH = ctx.canvas.height

    if (config.motionBlur) {
        ctx.fillStyle = `rgba(0,0,0,${config.motionBlurLength})`
        ctx.fillRect(0, 0, cW, cH)
    } else {
        ctx.clearRect(0, 0, cW, cH)
        if (bgColor) {
            ctx.fillStyle = bgColor as string
            ctx.fillRect(0, 0, cW, cH)
        }
    }

    ctx.fillStyle = `rgba(${oscillocolor},${opacity ?? 1})`
    const fb = analyser.frequencyBinCount
    const freqByteData = new Uint8Array(fb)
    analyser.getByteTimeDomainData(freqByteData)

    ctx.lineWidth = 2
    ctx.strokeStyle = `rgba(${oscillocolor},${opacity ?? 1})`

    for (let i = 0; i < fb; i++) {
        const value_old = freqByteData[i - 1]

        const percent_old: number = value_old / 256
        const height_old: number = cH * percent_old
        const offset_old: number = cH - height_old - 1
        const barWidth_old: number = cW / analyser.frequencyBinCount

        const value: number = freqByteData[i]
        const percent: number = value / 256
        const height: number = cH * percent
        const offset: number = cH - height - 1
        const barWidth: number = cW / analyser.frequencyBinCount

        ctx.beginPath()
        ctx.moveTo((i - 1) * barWidth_old, offset_old)
        ctx.lineTo(i * barWidth, offset)
        ctx.stroke()
    }
}
