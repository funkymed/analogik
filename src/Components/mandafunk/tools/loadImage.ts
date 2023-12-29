import { Scene, TextureLoader } from 'three'
import { createMesh } from './createMesh'

export const loadImage = function (name: string, file: string, options: any, scene: Scene) {
    const texture = new TextureLoader().load(
        file,
        (image) => {
            console.log(image, options)
            const mesh: any = createMesh(name, image, options, false)
            mesh.objType = options.objType
            scene.add(mesh)
        },
        (progress) => {
            console.log('progress', progress)
        },
        (error) => {
            // console.error("error", error);
        }
    )
}
