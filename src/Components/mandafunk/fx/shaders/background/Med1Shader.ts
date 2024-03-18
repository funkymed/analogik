import { ShaderAbstract } from "./ShaderAbstract.ts";

export class Med1Shader extends ShaderAbstract {
  constructor() {
    super();

    this.fshader += `
        vec3 palette( in float t)
        {
            vec3 a = vec3(0.5, 0.5, 0.5);
            vec3 b = vec3(0.5, 0.5, 0.5);
            vec3 c = vec3(1.0,1.0,1.0);
            vec3 d = vec3(0.076,0.364,0.940);
            return (a + b*cos( 6.28318*(c*t+d)) )*.2;
        }

        float sdCircle( vec2 p, float r )
        {
            return length(p) - r;
        }

        vec2 rotateUv(vec2 uv, vec2 pivot, float rotation) {
            float cosa = cos(rotation);
            float sina = sin(rotation);
            uv -= pivot;
            return vec2(
                cosa * uv.x - sina * uv.y,
                cosa * uv.y + sina * uv.x 
            ) + pivot;
        }

        void main(void)
        {
            
            vec2 uv = ((vUv.xy*iResolution.xy) *2.0 - iResolution.xy) / min(iResolution.x, iResolution.y);  
            vec2 uv0 = uv;
            vec3 finaleColor = vec3(0.0);
            
            uv = rotateUv(uv, vec2(0.), iTime*0.2);
            uv0 = rotateUv(uv0, vec2(0.), iTime*0.2);

            for(float i = 0.0; i < 6.0; i++){
                float x = sin(i)*5.;
                uv = fract(uv*1.3) - 0.5;

                float d = sdCircle(uv, 3.0) * exp(-length(uv0));

                vec3 col = palette(length(uv0) + i * .5 + iTime * .5);

                d = sin(d * 8. - iTime) / 8.;
                d = abs(d);
                d = pow(0.02 / d, 1.5);

                finaleColor += col * d; 
            }
                
            gl_FragColor = vec4(finaleColor, iOpacity);

        }
        `;
  }
}
