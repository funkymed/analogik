import { ShaderAbstract } from '../ShaderAbstract'

export class NeonCircleShader extends ShaderAbstract {
    constructor() {
        super()

        this.fshader+= `
        void main( void )
        {
            vec2 uv = ((vUv.xy*iResolution.xy)  - 0.5 * iResolution.xy) / iResolution.y;

            vec2 gv = uv * 50.0 ;
            gv = fract(gv) - 0.5;

            float t = iTime * 5.0;

            float s = (sin(t - length(uv * 2.0) * 5.0) * 0.4 + 0.5) * 0.6;
            float m = smoothstep(s, s - 0.05, length(gv)) + s*2.0;

            vec3 col = vec3(s, 0.0, 0.5) * m;

            gl_FragColor = vec4(col, iOpacity);
        }
        `
    }
}
