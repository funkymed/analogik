import { Texture } from 'three'

export interface canvas2texture {
    canvas: HTMLCanvasElement
    context: CanvasRenderingContext2D | null
    texture: Texture
}

export function canvasTexture(w: number, h: number): canvas2texture {
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h

    const texture = new Texture(canvas)
    texture.needsUpdate = true

    const context = canvas.getContext('2d')
    return { canvas, context, texture }
}
