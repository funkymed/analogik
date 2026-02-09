import { LiteGraph, LGraphCanvas, LGraph, LGraphNode, LGraphGroup } from 'litegraph.js'
import { getNode } from './nodes/getNode.ts'

import { ConfigType } from '../types/config.ts'
import { Composer } from '../fx/composer.ts'
import { StaticItems } from '../fx/static.ts'
import { updateImageFast, updateImages } from '../fx/image.ts'
import { updateTexts } from '../fx/text.ts'
import { MandaScene } from '../scene.ts'

export class EditorNode {
    config: ConfigType
    guiButtons: any
    scene: MandaScene
    composer: Composer
    staticItems: StaticItems
    loader: Function
    graph: LGraph
    constructor(
        config: ConfigType,
        scene: MandaScene,
        composer: Composer,
        staticItems: StaticItems,
        loader: Function
    ) {
        this.config = config
        this.scene = scene
        this.composer = composer
        this.staticItems = staticItems
        this.loader = loader
        this.graph = new LGraph()
    }

    async updateConfig(name: string, item: string, value: string, configItem: any) {
        if (name.indexOf('Scene') != -1) {
            await this.scene.updateSceneBackground(this.config)
        } else if (name.indexOf('Composer') != -1) {
            this.composer.updateComposer(this.config)
        } else if (
            name.indexOf('Timer') != -1 ||
            name.indexOf('Vumeter') != -1 ||
            name.indexOf('Progress') != -1
        ) {
            this.staticItems.update(this.config)
        } else if (name.indexOf('Texts/') != -1) {
            updateTexts(this.scene.getScene(), this.config)
        } else if (name.indexOf('Images/') != -1) {
            if (typeof value === 'string') {
                updateImages(this.scene.getScene(), this.config)
            } else {
                const _name: string = name.split('/')[1]
                console.log(_name, configItem)
                updateImageFast(_name, this.scene.getScene(), configItem)
            }
        }
    }

    clear() {
        const serialized: any = this.graph.serialize()
        let n: LGraphNode
        for (n of serialized.nodes) {
            this.graph.remove(n)
        }
        this.graph = new LGraph()
        this.deleteNotAllowedNodes()
    }
    addAllowedNodes = () => {
        const basicDefault: any = class basicDefault {}
        LiteGraph.registerNodeType('basic/default', basicDefault)
    }
    deleteNotAllowedNodes = () => {
        // remove not allowed nodes
        // TODO: Re-register deleted nodes
        for (const nodeType in LiteGraph.registered_node_types) {
            if (!['basic/default'].find((v) => v === nodeType)) {
                delete LiteGraph.registered_node_types[nodeType]
            }
        }
    }

    init(config: ConfigType) {
        this.clear()
        this.config = config
        var canvas = new LGraphCanvas('#graph-editor', this.graph)
        canvas.allow_dragcanvas = true
        canvas.allow_dragnodes = true
        canvas.allow_interaction = true
        canvas.allow_reconnect_links = true
        canvas.show_info = false
        canvas.allow_searchbox = false

        // SCENE
        const n = getNode(`Scene`, config.scene, this.updateConfig.bind(this))
        n.pos = [0, 250]
        n.shape = LiteGraph.BOX_SHAPE
        this.graph.add(n)

        const compoGroup = new LGraphGroup()
        compoGroup.title = 'Composer'
        compoGroup.color = '#00BBFF'

        // COMPOSERS
        let c = 1
        for (let [key, value] of Object.entries(config.composer)) {
            const n = getNode(`Composer/${key}`, value, this.updateConfig.bind(this))
            n.pos = [300 * c, 250]

            this.graph.add(n)
            c++
        }

        // MUSIC
        // const nMusic = getNode(`Music`, config.music, this.updateConfig.bind(this))
        // nMusic.pos = [300 * c, 250]
        // this.graph.add(nMusic)
        // c++

        // TIMER
        const nTimer = getNode(`Timer`, config.timer, this.updateConfig.bind(this))
        nTimer.pos = [300 * c, 250]
        this.graph.add(nTimer)
        c++

        // // PROGRESSBAR
        const nProgress = getNode(`Progress bar`, config.progressbar, this.updateConfig.bind(this))
        nProgress.pos = [300 * c, 250]
        this.graph.add(nProgress)
        c++

        // // VUMETERS
        for (let [key, value] of Object.entries(config.vumeters)) {
            const nVu = getNode(`Vumeters/${key}`, value, this.updateConfig.bind(this))
            nVu.pos = [300 * c, 250]
            this.graph.add(nVu)
            c++
        }

        // TEXTS
        for (let [item, configText] of Object.entries(config.texts)) {
            const nVu = getNode(`Texts/${item}`, configText, this.updateConfig.bind(this))
            nVu.pos = [300 * c, 250]
            this.graph.add(nVu)
            c++
        }

        // IMAGES
        for (let [key, configImage] of Object.entries(config.images)) {
            const nVu = getNode(`Images/${key}`, configImage, this.updateConfig.bind(this))
            nVu.pos = [300 * c, 250]
            this.graph.add(nVu)
            c++
        }

        canvas.adjustNodesSize()
        canvas.resize()
        this.graph.start()
    }
}
