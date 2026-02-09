import { convertHMS } from '../tools/convertHMS.ts'

export const progresstimer = function (
    ctx: CanvasRenderingContext2D | null,
    color: string,
    bgColor: string | boolean,
    opacity: number,
    size: number,
    font: string,
    currentTime: number,
    audioDuration: number,
    align: string
) {
    if (!ctx) {
        return
    }
    var text = `${convertHMS(currentTime)} / ${convertHMS(audioDuration)}`
    var cW = ctx.canvas.width
    var cH = ctx.canvas.height

    ctx.clearRect(0, 0, cW, cH)

    ctx.font = ` ${size}px ${font}`
    const metrics = ctx.measureText(text)

    let posX = 20
    let posY = size

    if (align === 'center') {
        posX = cW / 2 - metrics.width / 2
    }

    ctx.fillStyle = `rgba(${color},${opacity ?? 1})`
    ctx.fillText(text, posX, posY)
}
