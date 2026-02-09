import { Scene, TextureLoader } from 'three'
import { createMesh } from './createMesh.ts'

export const loadImage = function (name: string, file: string, options: any, scene: Scene) {
    new TextureLoader().load(
        file,
        (image) => {
            const mesh: any = createMesh(name, image, options, false)
            mesh.objType = options.objType
            scene.add(mesh)
        },
        undefined,
        undefined
    )
}
