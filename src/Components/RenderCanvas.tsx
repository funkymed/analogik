import { Clock, PerspectiveCamera, Scene, WebGLRenderer, Color } from 'three'
import { useEffect, useRef, JSX, useState } from 'react'

import { ConfigType } from './mandafunk/types/config.ts'
import { configDefault } from './mandafunk/config.ts'
import { MandaScene } from './mandafunk/scene.ts'
import { loadJson } from './mandafunk/loader.ts'
import { updateImageAnimation, updateImages } from './mandafunk/fx/image.ts'
import { updateTexts } from './mandafunk/fx/text.ts'
import { StaticItems } from './mandafunk/fx/static.ts'

import { Composer } from './mandafunk/fx/composer.ts'

import { getHttpParam } from './mandafunk/tools/http.ts'
import { getRandomArbitrary } from './mandafunk/tools/random.ts'
import { Editor } from './mandafunk/gui/editor.ts'
import { EditorNode } from './mandafunk/gui/editorNode.ts'
import testConfig from '../config.ts'

function RenderCanvas(props: any): JSX.Element {
    let canvasRef = useRef()
    const [playing, setPlaying] = useState(0)
    const [player, setPlayer] = useState(0)
    let camera: PerspectiveCamera
    let manda_scene: MandaScene
    let analyser: AnalyserNode
    let renderer: WebGLRenderer
    let composer: Composer
    let time: number = 0
    let context: AudioContext
    let staticItems: StaticItems
    let scene: Scene
    let currentConfig: ConfigType
    let clock: Clock
    let isinit: boolean = false

    const init = (canvas: any) => {
        console.log('init canvas')
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

        clock = new Clock()

        // Scene
        currentConfig = testConfig

        context = props.audioContext
        const sourceNode = context.createBufferSource()

        manda_scene = new MandaScene()
        scene = manda_scene.getScene()
        staticItems = new StaticItems(
            currentConfig,
            props.player,
            props.audioContext,
            props.analyser,
            scene
        )
        manda_scene.setStatic(staticItems)

        // Camera
        camera = new PerspectiveCamera(60, W / H, 0.1, 2000)
        camera.aspect = W / H
        camera.updateProjectionMatrix()
        camera.position.set(0, 0, 0)
        camera.lookAt(scene.position)
        camera.layers.enable(1)

        // Renderer
        renderer = new WebGLRenderer({
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance',
            preserveDrawingBuffer: false,
            precision: 'highp',
            canvas: canvasRef.current,
        })
        renderer.debug.checkShaderErrors = true
        renderer.autoClear = false
        renderer.autoClearColor = true
        renderer.setPixelRatio(window.devicePixelRatio)
        // document.body.appendChild(renderer.domElement)

        // Composer
        composer = new Composer(renderer, manda_scene, camera)

        handleResize()
    }

    const loadConfig = () => {
        //Config Init
        manda_scene.updateSceneBackground(currentConfig)
        manda_scene.clearScene()
        updateImages(scene, currentConfig)
        updateTexts(scene, currentConfig)
        staticItems.update(currentConfig)
        updateImageAnimation(scene, currentConfig, time)
        composer.updateComposer(currentConfig)
    }

    const render = (time: number) => {
        // renderer.render(scene, camera)
        composer.rendering(time)
    }

    const handleResize = () => {
        const W = window.innerWidth
        const H = window.innerHeight
        camera.aspect = W / H
        camera.updateProjectionMatrix()
        renderer.setSize(W, H)
        render(time)
    }

    const animate = () => {
        requestAnimationFrame(animate)
        time = clock ? clock.getElapsedTime() : 0
        // time = playing && player ? player.getPosition() : 0
        // console.log(playing, props.isPlay, time)

        updateImageAnimation(scene, currentConfig, time)
        staticItems.rendering(time)
        render(time)
    }

    useEffect(() => {
        if (!isinit) {
            isinit = true
            init(canvasRef.current)
            loadConfig()
            window.addEventListener('resize', handleResize)
            animate()
        }
        return () => {
            window.removeEventListener('resize', handleResize)
        }
    }, [])

    useEffect(() => {
        setPlaying(true)
        analyser = props.analyser
        console.log(playing, props.isPlay)
    }, [props.isPlay])

    useEffect(() => {
        analyser = props.analyser
        staticItems.setAnalyser(props.analyser)
        console.log(analyser)
    }, [props.analyser])

    useEffect(() => {
        setPlayer(props.player)
        console.log(player)
    }, [props.player])

    return <canvas className="canvasStyle" ref={canvasRef} />
}

export default RenderCanvas
