import { LiteGraph } from 'litegraph.js'
import { isColor } from '../../tools/isColor'

import {
    selectImagesPochette,
    selectImagesVinyl,
    varFloat,
    varFont,
    varAlign,
    varShader,
} from '../options'

const basicDefault: any = class basicDefault {}

LiteGraph.registerNodeType('basic/default', basicDefault)

function addWidget(node: any, name: string, config: any, updater: any) {
    for (const item in config) {
        const callback = function (value: any) {
            config[item] = value
            updater(name, item, value, config)
        }

        if (typeof config[item] === 'object' || Array.isArray(config[item])) {
            // addconfigectToFolder(folder, config[item], false)
        } else if (typeof config[item] === 'number') {
            if (varFloat[item]) {
                node.addWidget('slider', item, config[item], callback, {
                    min: varFloat[item][0],
                    max: varFloat[item][1],
                })
                // }
            } else if (name.indexOf('Images/') != -1 && ['x', 'y', 'z'].includes(item)) {
                if (item == 'z') {
                    node.addWidget('slider', item, config[item], callback, {
                        min: -5,
                        max: -1,
                    })
                } else {
                    node.addWidget('slider', item, config[item], callback, {
                        min: -2,
                        max: 2,
                    })
                }
            } else if (
                (name.indexOf('Texts/') != -1 ||
                    name.indexOf('Timer') != -1 ||
                    name.indexOf('Vumeters/') != -1 ||
                    name.indexOf('Progress') != -1) &&
                ['x', 'y', 'z'].includes(item)
            ) {
                if (item == 'z') {
                    node.addWidget('slider', item, config[item], callback, {
                        min: -650,
                        max: -1,
                    })
                } else {
                    node.addWidget('slider', item, config[item], callback, {
                        min: -650,
                        max: 650,
                    })
                }
            } else {
                node.addWidget('text', item, config[item], callback)
            }
        } else if (typeof config[item] === 'boolean') {
            node.addWidget('toggle', item, config[item], callback)
        } else {
            if (config[item] && isColor(config[item])) {
                node.addWidget('text', item, config[item], callback)
            } else {
                if (name.indexOf('vinyl') != -1 && config.path) {
                    node.addWidget('combo', item, config[item], callback, {
                        values: selectImagesVinyl,
                    })
                } else if (name.indexOf('pochette') != -1 && config.path) {
                    node.addWidget('combo', item, config[item], callback, {
                        values: selectImagesPochette,
                    })
                } else if (item === 'background' && config.background) {
                    node.addWidget('combo', item, config[item], callback, {
                        values: selectImagesPochette,
                    })
                } else if (name.indexOf('image-') != -1 && config.path) {
                    node.addWidget('combo', item, config[item], callback, {
                        values: selectImagesPochette,
                    })
                } else if (item === 'font') {
                    node.addWidget('combo', item, config[item], callback, { values: varFont })
                } else if (item === 'shader') {
                    node.addWidget('combo', item, config[item], callback, { values: varShader })
                } else if (item === 'align') {
                    node.addWidget('combo', item, config[item], callback, { values: varAlign })
                }
            }
        }
    }
}

export const getNode = function (name: string, config: any, updater: any) {
    const node = LiteGraph.createNode('basic/default')
    node.title = name
    node.shape = LiteGraph.ROUND_SHAPE

    addWidget(node, name, config, updater)

    return node
}
