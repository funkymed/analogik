import { ShaderAbstract } from './ShaderAbstract.ts'

export class RadialFftShader extends ShaderAbstract {
    constructor() {
        super()

        this.fshader += `
        void main( void )
        {
            vec2 uv = ((vUv.xy*iResolution.xy) - 0.5 * iResolution.xy) / iResolution.y;   
               
            // It's not, at all, but it'll do for now.
            float bass = 0.2 + 4. * log(texture(iChannel1, vec2(0.02, 0.0)).r 
                                        + texture(iChannel1, vec2(0.03, 0.0)).r);
        
            float d = length(uv) * 1.5;
            vec4 audio = texture(iChannel1, vec2(d * (sin(iTime / 5.)  + 1.25) * 0.1, 0.0));
        
            float amp = audio.r / 2.5;                   
            gl_FragColor = vec4(
                smoothstep(0.0, d, amp) * bass,
                smoothstep(0.0, d, amp * 0.8) * (sin(iTime / 2.) + 1.) * 0.5 * bass,
                smoothstep(0.0, d, amp * 0.5) * (cos(iTime / 2.001) + 1.) * 0.25 * bass,
                iOpacity
            ); 
        }
        `
    }
}
