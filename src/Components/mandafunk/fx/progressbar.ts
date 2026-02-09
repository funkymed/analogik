export const progressbar = function (
    ctx: CanvasRenderingContext2D | null,
    color: string,
    cursorColor: string,
    bgColor: string | boolean,
    opacity: number,
    progress: number
) {
    if (!ctx) {
        return
    }
    if (progress > 100) {
        progress = 100
    }
    var cW = ctx.canvas.width - 2
    var cH = ctx.canvas.height
    ctx.clearRect(0, 0, cW + 2, cH)

    ctx.fillStyle = `rgba(${color},${opacity ?? 1})`
    ctx.fillRect(0, cH / 2 - 1, cW, 4)

    var rect = ctx.canvas.getBoundingClientRect()
    var posx = Math.round((progress / 100) * cW)
    if (posx > cW - 2) {
        posx = cW - 2
    }
    if (posx < 4) {
        posx = 4
    }
    var posy = cH / 2 - rect.top + 1

    ctx.fillStyle = cursorColor
    ctx.beginPath()
    ctx.arc(posx, posy, 4, 0, 2 * Math.PI)
    ctx.fill()
}
