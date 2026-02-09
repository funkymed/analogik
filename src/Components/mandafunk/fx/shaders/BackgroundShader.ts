import { Mesh, Scene, ShaderMaterial } from 'three'
import { ConfigType } from '../../types/config'
import { StaticItems } from '../static'

export interface BackgroundShader {
    vshader: string
    fshader: string
    uniforms: any
    shaderMaterial: ShaderMaterial
    mesh: Mesh
    init(config: ConfigType, scene: Scene, staticItems: StaticItems): Promise<void>
    update(time: number): void
    clear(): void
    afterInit(): void
}
