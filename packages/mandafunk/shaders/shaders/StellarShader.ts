import { ShaderAbstract } from '../ShaderAbstract'

export class StellarShader extends ShaderAbstract {
    constructor() {
        super()

        this.fshader += `
        // https://www.shadertoy.com/view/4tXczM
        float map(vec3 p)
        {
            float r = 0.1 * (1.0 + sin(float(floor(p))));
            vec3 q = fract(p) * 2.0 - 1.0;
            return length(q) - r;
        }

        float trace(vec3 o, vec3 r)
        {
            float d = 0.0;
            for (int i = 0; i < 32; i++)
            {
                vec3 p = o + r * d;
                d += map(p) * 0.5;
            }
            return d;
        }

        void main( void )
        {
            vec2 uv = (vUv*iResolution.xy) / iResolution.xy; // Screen coord to [0,1[ range.
            uv = uv * 2.0 - 1.0;                     // To [-1, 1[ range.
            uv.x *= iResolution.x / iResolution.y;   // Fix aspect ratio.

            vec3 o = vec3(iTime, cos(iTime), sin(iTime)); // Observer's position

            vec3 r = normalize(vec3(uv, 1.7));
            float a = iTime / 5.0; // Observer's rotation angle
            r.xz *= mat2(cos(a), -sin(a), sin(a), cos(a)); // Rotate the observer
            float d = trace(o, r); // Shoot the ray!
            float fog = 10.0 / (1.0 + d * d * 0.05); // Compute the fog's effect.
            vec3 col = vec3(cos(iTime) * 0.5 + 0.5, // Red
                            0.5 * sin(iTime) + 0.5, // Green
                            sin(iTime / 3.1243));   // Blue
                            gl_FragColor = vec4(fog * col, iOpacity); // apply the fog to that color.
        }
        `
    }

}
