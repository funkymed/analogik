import { Scene } from 'three'
import { deepClone } from '../tools/deepClone.ts'
import { writeText } from '../tools/writeText.ts'
import { ConfigType } from '../types/config.ts'

export const updateTexts = function (scene: Scene, config: ConfigType) {
    for (let mesh in scene.children) {
        const item: any = scene.children[mesh]
        const objType: string = item?.objType || 'undefined'
        if (objType === 'text') {
            scene.remove(item)
        }
    }
    for (let text in config.texts) {
        if (typeof config.texts[text] === 'object') {
            const options = deepClone(config.texts[text])
            options.objType = 'text'
            if (options.show) {
                const mesh: any = writeText(text, options.text, options)
                scene.add(mesh)
            }
        }
    }
}
