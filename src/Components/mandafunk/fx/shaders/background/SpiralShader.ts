import { ShaderAbstract } from './ShaderAbstract.ts'

export class SpiralShader extends ShaderAbstract {
    constructor() {
        super()

        this.fshader += `
        void main()
        {
            vec2 z = 8.*(2.*(vUv*iResolution.xy)-iResolution.xy)/iResolution.xx;
            float t = iTime, d = 1./dot(z,z);
        
            gl_FragColor =
                // color
                vec4(d*3.,.5,0,0)*
                // stripes
                sin(atan(z.y,z.x)*30.+d*99.+4.*t)*
                // rings
                sin(length(z*d)*20.+2.*t)*
                // depth
                max(dot(z,z)*.4-.4,0.);
        }
        `
    }
    afterInit() {
        this.shaderMaterial.transparent = false
    }
}
