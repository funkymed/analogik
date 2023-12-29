import { createMesh } from './createMesh'
import { fillText } from './fillText'

export const writeText = function (name: string, text: string, options: any) {
    const texture = fillText(
        text,
        options.font || 'Arial',
        options.size || 64,
        options.color || 'black',
        options.align || 'center'
    )

    const mesh: any = createMesh(name, texture, options, true)
    mesh.objType = options.objType
    return mesh
}
