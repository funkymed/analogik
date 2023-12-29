import { ShaderAbstract } from './ShaderAbstract.ts'

export class DiscoShader2 extends ShaderAbstract {
    constructor() {
        super()
        
        this.fshader+= `
        precision highp float;

        void main( void )
        {
            float s = 0.0, v = 0.0;
            vec2 uv = ((vUv*iResolution.xy) / iResolution.xy) * 2.0 - 1.;
            float iTime = (iTime-2.0)*100.0;
            vec3 col = vec3(0);
            vec3 init = vec3(sin(iTime * .0032)*.3, .35 - cos(iTime * .005)*.3, iTime * 0.002);
            for (int r = 0; r < 24; r++) 
            {
                vec3 p = init + s * vec3(uv, 0.05);
                p.z = fract(p.z);
                // Thanks to Kali's little chaotic loop...
                for (int i=0; i < 8; i++)	p = abs(p * 2.04) / dot(p, p) - .9;
                v += pow(dot(p, p), .7) * .6;
                col +=  vec3(v * 0.2+.4, 12.-s*2., .1 + v * 1.) * v * 0.00003;
                s += .025;
            }
            gl_FragColor = vec4(clamp(col, 0.0, 1.0), iOpacity);
        }
        `
    }

}
