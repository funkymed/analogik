import { ShaderAbstract } from '../ShaderAbstract'

export class StarfieldShader extends ShaderAbstract {
    constructor() {
        super()

        this.fshader += `
        #define NUM_OF_LAYERS 6.

        mat2 rotate(float angle) {
            float s = sin(angle);
            float c = cos(angle);
            return mat2(c, -s, s, c);
        }

        float hash12(vec2 p) {
            p = fract(p * vec2(123.45, 98.765));
            p += dot (p, p + 2.67);
            return fract(p.x * p.y);
        }

        float star(vec2 uv, float flare) {
            float d = length(uv);
            float m = 0.05/d;
            float rays = max(0., 1. - abs(uv.x * uv.y * 1000.));
            m += rays * flare;
            uv *= rotate(3.1415/4.);
            rays = max(0., 1. - abs(uv.x * uv.y * 1000.));
            m += rays * flare * .3;
            m *= smoothstep(1., .2, d);
            return m;
        }

        vec3 starLayer(vec2 uv) {
            vec3 col = vec3(0);
            vec2 gv = fract(uv) - .5;
            vec2 id = floor(uv);

            for (int y = -1 ; y <= 1; y++) {
                for (int x = -1 ; x <= 1; x++) {
                    vec2 offs = vec2(x, y);
                    float n = hash12(id + offs);
                    float size = fract(n * 931.261);
                    float star = star(gv - offs - vec2(n, fract(n * 34.)) + .5, smoothstep(.9, 1., size) * .6);
                    vec3 color = sin(vec3(.2, .3, .4) * fract(n * 2345.6) * 123.45) * .5 + .5;
                    color *= vec3(1., .25, 1. + size);

                    star *= 1. + sin(n * iTime * 23. + n * 6.2831) * .125;
                    col += size * star * color;
                }
            }

            return col;
        }

        void main( void )
        {
            // Normalized pixel coordinates (from 0 to 1)
            vec2 uv = ((vUv*iResolution.xy) - .5 * iResolution.xy) / iResolution.y;
            float t = iTime * .05;
            uv *= rotate(t);

            vec3 col = vec3(0);

            for (float i = 0.; i < 1.; i += 1.0 / NUM_OF_LAYERS) {
                float depth = fract(i + t);
                float fade = depth * smoothstep(2., .5, depth);
                float scale = mix(20., .5, depth);
                col += starLayer(uv * scale + i * 342.23) * fade;
            }

            //if (gv.x > .48 ||gv.y > .48) col.r = 1.;
            //col += hash12(uv);

            // Output to screen
            gl_FragColor = vec4(col, iOpacity);
        }
        `
    }
}
