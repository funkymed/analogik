import { Clock, PerspectiveCamera, Scene, WebGLRenderer } from 'three'
import { useEffect, useRef, JSX } from 'react'

import { ConfigType } from './mandafunk/types/config.ts'
import { configDefault } from './mandafunk/config.ts'
import { MandaScene } from './mandafunk/scene.ts'
import { loadJson } from './mandafunk/loader.ts'
import { updateImageAnimation, updateImages } from './mandafunk/fx/image.ts'
import { updateTexts } from './mandafunk/fx/text.ts'
import { StaticItems } from './mandafunk/fx/static.ts'
import { Audio } from './mandafunk/fx/audio.ts'
import { Composer } from './mandafunk/fx/composer.ts'

import { getHttpParam } from './mandafunk/tools/http.ts'
import { getRandomArbitrary } from './mandafunk/tools/random.ts'
import { Editor } from './mandafunk/gui/editor.ts'
import { EditorNode } from './mandafunk/gui/editorNode.ts'

function init(canvas: HTMLBaseElement) {
    // init
    const w = window,
        d = document,
        g = d.getElementsByTagName('body')[0],
        html = d.getElementsByTagName('html')[0]
    g.style.background = 'black'
    g.style.width = '100%'
    g.style.height = '100%'
    g.style.margin = '0'

    const isEditor = getHttpParam('editor')

    html.style.width = '100%'
    html.style.height = '100%'
    html.style.margin = '0'

    let W = w.innerWidth
    let H = w.innerHeight

    const clock = new Clock()
    let time = 0

    // Scene
    let currentConfig = configDefault
    const audio = new Audio(currentConfig)

    const manda_scene = new MandaScene(audio)
    const scene: Scene = manda_scene.getScene()
    const staticItems = new StaticItems(currentConfig, audio, scene)
    manda_scene.setStatic(staticItems)

    // Camera
    const camera = new PerspectiveCamera(60, W / H, 0.1, 2000)
    camera.aspect = W / H
    camera.updateProjectionMatrix()
    camera.position.set(0, 0, 0)
    camera.lookAt(scene.position)
    camera.layers.enable(1)
}

function RenderCanvas(): JSX.Element {
    let canvasRef = useRef()

    useEffect(() => {
        console.log(canvasRef.current)
        init(canvasRef.current)
    }, [])

    return <canvas ref={canvasRef} />
}

export default RenderCanvas
