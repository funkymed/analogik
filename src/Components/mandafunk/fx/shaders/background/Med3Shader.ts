import { ShaderAbstract } from "./ShaderAbstract.ts";

export class Med3Shader extends ShaderAbstract {
  constructor() {
    super();

    this.fshader += `
        vec3 palette( in float t)
        {
            vec3 a = vec3(0.608, 0.408, 0.500);
            vec3 b = vec3(0.188, 0.398, 0.500);
            vec3 c = vec3(1.000, 1.000, 0.508);
            vec3 d = vec3(2.000, 1.333, 0.667);
            return a + b*cos( 6.28318*(c*t+d) );
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
        
        void main( void )
        {
            
            vec2 uv = ((vUv.xy*iResolution.xy) *2.0 - iResolution.xy) / min(iResolution.x, iResolution.y);
            vec2 uv0 = uv;
            vec3 finaleColor = vec3(.0);
            
            uv = rotateUv(uv, vec2(0.), iTime*0.2);
            uv0 = rotateUv(uv0, vec2(0.), iTime*0.2);
        
            for(float i = 0.0; i < 6.0; i++){
                vec2 zz= vec2(iTime * .8);
                uv = fract(uv + zz) - .5;
        
                float d = sdCircle(uv, 1.) * exp(-length(uv0));
        
                vec3 col = palette(length(uv0) + i * .2 + iTime * 1.);
        
                d = sin(d * 7. ) / 9.;
                d = abs(d);
                d = pow(0.01 / d, 1.3);
        
                finaleColor += col * d; 
            }
                
            gl_FragColor = vec4(finaleColor, iOpacity);
        
        }
        `;
  }
}
