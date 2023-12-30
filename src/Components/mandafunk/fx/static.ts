import { hextoRGB } from '../tools/color.ts'
import { ConfigType } from '../types/config.ts'
import { canvas2texture, canvasTexture } from '../tools/canvas2texture.ts'
import { createMesh } from '../tools/createMesh.ts'
import {
    AdditiveBlending,
    Mesh,
    MeshBasicMaterial,
    NormalBlending,
    PlaneGeometry,
    Scene,
} from 'three'
import { spectrum } from './spectrum.ts'
import { oscillo } from './osciloscope.ts'
import { progressbar } from './progressbar.ts'
import { progresstimer } from './progresstimer.ts'

export class StaticItems {
    config: ConfigType
    audio: AudioContext
    analyser: AnalyserNode
    textureSpectrum: canvas2texture
    textureOscillo: canvas2texture
    textureProgress: canvas2texture
    textureTimer: canvas2texture
    vumeterObj: Mesh
    oscilloObj: Mesh
    timerObj: Mesh
    progressbarObj: Mesh
    scene: Scene
    player: any
    time: number

    constructor(
        config: ConfigType,
        player: any,
        audio: AudioContext,
        analyser: AnalyserNode,
        scene: Scene
    ) {
        this.config = config
        this.audio = audio
        this.analyser = analyser
        this.scene = scene
        this.player = player

        // Spectrum
        this.textureSpectrum = canvasTexture(
            config.vumeters.spectrum.width,
            config.vumeters.spectrum.height
        )
        this.vumeterObj = createMesh(
            'vumeter',
            this.textureSpectrum.texture,
            {
                x: config.vumeters.spectrum.x,
                y: config.vumeters.spectrum.y,
                z: config.vumeters.spectrum.z,
                order: 2,
                width: config.vumeters.spectrum.width,
                height: config.vumeters.spectrum.height,
            },
            false
        ) as Mesh
        this.scene.add(this.vumeterObj)

        // Oscilloscope
        this.textureOscillo = canvasTexture(
            config.vumeters.oscilloscop.width,
            config.vumeters.oscilloscop.height
        )
        this.oscilloObj = createMesh(
            'oscillo',
            this.textureOscillo.texture,
            {
                x: config.vumeters.oscilloscop.x,
                y: config.vumeters.oscilloscop.y,
                z: config.vumeters.oscilloscop.z,
                width: config.vumeters.oscilloscop.width,
                height: config.vumeters.oscilloscop.height,
                order: 2,
            },
            false
        ) as Mesh
        this.scene.add(this.oscilloObj)

        // progressbar
        this.textureProgress = canvasTexture(config.progressbar.width, config.progressbar.height)

        this.progressbarObj = createMesh(
            'progressbar',
            this.textureProgress.texture,
            {
                x: config.progressbar.x || 0,
                y: config.progressbar.y || 0,
                z: config.progressbar.z || 0,
                width: config.progressbar.width,
                height: config.progressbar.height,
                order: 2,
            },
            false
        ) as Mesh
        this.scene.add(this.progressbarObj)

        // timer
        this.textureTimer = canvasTexture(config.progressbar.width, config.progressbar.height)

        this.timerObj = createMesh(
            'timer',
            this.textureTimer.texture,
            {
                x: config.timer.x,
                y: config.timer.y,
                z: config.timer.z,
                width: config.timer.width,
                height: config.timer.height,
                order: 2,
            },
            false
        )
        this.scene.add(this.timerObj)

        this.update(config)
    }
    setAnalyser(analyser: AnalyserNode) {
        this.analyser = analyser
        console.log(analyser)
    }

    update(config: ConfigType) {
        this.config = config
        this.updateMesh(this.progressbarObj, config.progressbar)
        this.updateMesh(this.timerObj, config.timer)
        this.updateMesh(this.vumeterObj, config.vumeters.spectrum)
        this.updateMesh(this.oscilloObj, config.vumeters.oscilloscop)
    }

    updateMesh(mesh: Mesh, option: any) {
        const material = mesh.material as MeshBasicMaterial
        material.blending = option.motionBlur ? AdditiveBlending : NormalBlending
        mesh.material = material

        mesh.position.set(option.x || 0, option.y || 0, option.z || 0)
        mesh.rotation.set(option.rotationX || 0, option.rotationY || 0, option.rotationZ || 0)
        mesh.renderOrder = option.order || 0

        const zoom: number = option.zoom ?? 1
        const width: number = option.width ?? material.map?.image.width ?? 1
        const height: number = option.height ?? material.map?.image.height ?? 1

        const plane: PlaneGeometry = new PlaneGeometry(width * zoom, height * zoom)
        mesh.geometry = plane
    }

    rendering(time: number) {
        this.time = time
        this.vumeterObj.visible = this.config.vumeters.spectrum.show
        this.oscilloObj.visible = this.config.vumeters.oscilloscop.show
        this.timerObj.visible = this.config.timer.show
        this.progressbarObj.visible = this.config.progressbar.show

        if (this.textureSpectrum && this.textureSpectrum.context && this.analyser) {
            // if (this.config.vumeters.spectrum.show) {
            spectrum(this.textureSpectrum.context, this.config.vumeters.spectrum, this.analyser)
            this.textureSpectrum.texture.needsUpdate = true
            // }

            if (this.config.vumeters.oscilloscop.show) {
                oscillo(
                    this.textureOscillo.context,
                    this.config.vumeters.oscilloscop,
                    this.analyser
                )
                this.textureOscillo.texture.needsUpdate = true
            }
        }

        if (this.config.progressbar.show) {
            const progressAudio = 0 //(this.player.context.currentTime / this.player.duration()) * 100
            progressbar(
                this.textureProgress.context,
                hextoRGB(this.config.progressbar.color),
                this.config.progressbar.cursorColor,
                this.config.progressbar.bgColor,
                this.config.progressbar.opacity,
                progressAudio
            )
            this.textureProgress.texture.needsUpdate = true
        }
        if (this.config.timer.show) {
            progresstimer(
                this.textureTimer.context,
                hextoRGB(this.config.timer.color),
                this.config.timer.bgColor,
                this.config.timer.opacity,
                this.config.timer.size,
                this.config.timer.font,
                this.time, //this.player.getPosition(),
                0, //this.player.duration(),
                this.config.timer.align ?? 'center'
            )
            this.textureTimer.texture.needsUpdate = true
        }
    }
}
