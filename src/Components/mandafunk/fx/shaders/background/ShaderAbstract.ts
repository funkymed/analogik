import {
    Mesh,
    NearestFilter,
    PlaneGeometry,
    RepeatWrapping,
    Scene,
    ShaderMaterial,
    TextureLoader,
    Vector2,
} from 'three'
import { BackgroundShader } from '../BackgroundShader.ts'
import { ConfigType } from '../../../types/config.ts'
import { configDefault } from '../../../config.ts'
import { StaticItems } from '../../static.ts'

export abstract class ShaderAbstract implements BackgroundShader {
    uniforms: any
    vshader: string
    fshader: string
    shaderMaterial: ShaderMaterial
    mesh: Mesh
    scene: Scene
    config: ConfigType
    staticItems: StaticItems | false

    constructor() {
        this.shaderMaterial = new ShaderMaterial()
        this.mesh = new Mesh()
        this.scene = new Scene()
        this.staticItems = false
        this.vshader = `
        varying vec2 vUv;
        varying vec3 vPosition;
        void main( void ) {
          vUv = uv;
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
        }
        `
        this.fshader = `
        uniform float iTime;
        uniform float iOpacity;
        uniform vec2 iResolution;
        varying vec2 vUv;
        uniform sampler2D iChannel0;
        uniform sampler2D iChannel1;
        `
        this.config = configDefault
        this.uniforms = {
            iTime: { type: 'f', value: 0.0 },
            iOpacity: { type: 'f', value: 1.0 },
            diffuse: { type: 'c', value: { r: 0, g: 1, b: 0 } },
            iChannel0: { type: 't', value: null },
            iChannel1: { type: 't', value: null },
            iChannel2: { type: 't', value: null },
            iResolution: { type: 'v2', value: new Vector2() },
        }
    }

    init(config: ConfigType, scene: Scene, staticItems: StaticItems): void {
        this.config = config
        this.scene = scene
        this.staticItems = staticItems

        // this.uniforms.diffuse.value = {r:1,g:.2,b:.2}
        if (config.scene.background) {
            const loader = new TextureLoader()
            const background = loader.load(this.config.scene.background)
            background.minFilter = NearestFilter
            background.magFilter = NearestFilter
            background.wrapS = RepeatWrapping
            background.wrapT = RepeatWrapping
            this.uniforms.iChannel0.value = background
        }

        this.uniforms.iChannel1.value = staticItems.textureSpectrum.texture

        this.uniforms.iOpacity.value = this.config.scene.shader_opacity || 1.0
        this.updateResolution()

        const geometry = new PlaneGeometry(window.innerWidth, window.innerHeight)
        this.shaderMaterial = new ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: this.vshader,
            fragmentShader: this.fshader,
            transparent: true,
        })

        this.mesh = new Mesh(geometry, this.shaderMaterial)
        this.mesh.position.z = -650
        this.scene.add(this.mesh)
        this.afterInit()
    }

    afterInit() {}

    clear() {
        this.scene.remove(this.mesh)
    }

    updateResolution() {
        this.uniforms.iResolution.value.x = window.innerWidth
        this.uniforms.iResolution.value.y = window.innerHeight
        this.uniforms.iResolution.value.xy = window.innerWidth / window.innerHeight
    }

    update(time: number): void {
        // if (this.staticItems) {
        //     this.uniforms.iChannel1.value = this.staticItems.textureSpectrum.texture
        // }
        this.uniforms.iTime.value = time * (this.config.scene.shader_speed || 1)
    }
}
