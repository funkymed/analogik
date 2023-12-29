export function fillText(text: string, font: string, size: number, color: string, align: string) {
    const canvas: HTMLCanvasElement = document.createElement('canvas')
    const ctx: any = canvas.getContext('2d')

    canvas.width = 1024
    canvas.height = 256

    ctx.font = ` ${size}px ${font}`
    const metrics = ctx.measureText(text)

    let posX = 20
    let posY = size
    if (align === 'center') {
        posX = canvas.width / 2 - metrics.width / 2
        posY = size
    }

    ctx.strokeText(text, posX, posY)
    ctx.fillStyle = color || 'black'
    ctx.fillText(text, posX, posY)

    ctx.lineWidth = 1
    ctx.strokeStyle = color || 'black'
    ctx.strokeText(text, posX, posY)

    // document.body.appendChild(canvas);
    return canvas
}
