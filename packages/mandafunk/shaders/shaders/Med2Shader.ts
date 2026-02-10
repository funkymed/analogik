import { ShaderAbstract } from '../ShaderAbstract'

export class Med2Shader extends ShaderAbstract {
  constructor() {
    super();

    this.fshader += `
        vec3 palette( in float t)
        {
            vec3 a = vec3(0.5, 0.5, 0.5);
            vec3 b = vec3(0.5, 0.5, 0.5);
            vec3 c = vec3(2.0, 1.0, 0.0);
            vec3 d = vec3(0.50, 0.20, 0.25);
            return a + b*cos( 6.28318*(c*t+d) );
        }

        float sdCircle( vec2 p, float r )
        {
            return length(p) - r;
        }

        float sdOctogon( in vec2 p, in float r )
        {
            const vec3 k = vec3(-0.9238795325, 0.3826834323, 0.4142135623 );
            p = abs(p);
            p -= 2.0*min(dot(vec2( k.x,k.y),p),0.0)*vec2( k.x,k.y);
            p -= 2.0*min(dot(vec2(-k.x,k.y),p),0.0)*vec2(-k.x,k.y);
            p -= vec2(clamp(p.x, -k.z*r, k.z*r), r);
            return length(p)*sign(p.y);
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

        void main( )
        {
            vec2 uv = ((vUv.xy*iResolution.xy) * 2.0 - iResolution.xy) / min(iResolution.x, iResolution.y);
            vec2 uv0 = uv;
            vec3 finaleColor = vec3(0.0);

            uv = rotateUv(uv, vec2(0.), -iTime*0.3);
            uv0 = rotateUv(uv0, vec2(0.), -iTime*0.3);

            for(float i = 0.0; i < 2.0; i++){

                float x = 1.5+sin(iTime/2.)*.5;
                uv = fract(uv*x) - 0.5;

                float d = sdCircle(uv, 1.0) * exp(-length(uv0));

                vec3 col = palette(length(uv0) + i * .5 + iTime * .5);

                d = sin(d * 8. - iTime) / 2.2;
                d = abs(d);
                d = pow(0.03 / d, 1.2);

                finaleColor += col * d;

            }



            gl_FragColor = vec4(finaleColor, iOpacity);

        }
        `;
  }
}
