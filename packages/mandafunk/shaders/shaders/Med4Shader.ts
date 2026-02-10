import { ShaderAbstract } from '../ShaderAbstract'

export class Med4Shader extends ShaderAbstract {
  constructor() {
    super();

    this.fshader += `
        vec3 palette( in float t)
        {
            vec3 a = vec3(0.608, 0.408, 0.500);
            vec3 b = vec3(1.,0.,1.);
            vec3 c = vec3(0.000, 1.000, 0.508);
            vec3 d = vec3(0.000, 0.333, 0.667);
            return a + b*cos( 6.28318*(c*t+d) );
        }

        float sdHexagon( in vec2 p, in float r )
        {
            const vec3 k = vec3(-0.866025404,0.5,0.577350269);
            p = abs(p);
            p -= 2.0*min(dot(k.xy,p),0.0)*k.xy;
            p -= vec2(clamp(p.x, -k.z*r, k.z*r), r);
            return length(p)*sign(p.y);
        }

        float sdHexagram( in vec2 p, in float r )
        {
            const vec4 k = vec4(-0.5,0.8660254038,0.5773502692,1.7320508076);
            p = abs(p);
            p -= 2.0*min(dot(k.xy,p),0.0)*k.xy;
            p -= 2.0*min(dot(k.yx,p),0.0)*k.yx;
            p -= vec2(clamp(p.x,r*k.z,r*k.w),r);
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

        void main(void)
        {

            vec2 uv = ((vUv.xy*iResolution.xy) *2.0 - iResolution.xy) / min(iResolution.x, iResolution.y);
            vec2 uv0 = uv;
            vec3 finaleColor = vec3(0.0);

            vec2 plot = vec2(sin(iTime/5.));

            // uv = rotateUv(uv, plot, iTime/4.);
            uv=vec2(uv.x+10. , uv.y)+0.;
            // uv0 = rotateUv(uv0, vec2(0.), iTime/2.);

            float x = 1.3+(sin(iTime/8.) * .4);

            for(float i = 0.0; i < 8.0; i+=2.){

                uv = fract(uv*x) - 0.5;

                vec3 col = palette(length(uv0) + i * .2 + iTime * .2);

                float c = sdHexagram(uv, 2.0) * exp(-length(uv0));
                c = sin(c * 8. + (iTime+5.)) / 16.;
                c = abs(c);
                c = pow(0.03 / c, 0.2);

                float d = sdHexagon(uv, 1.0) * exp(-length(uv0));
                d = sin(d * 8. + iTime) / 8.;
                d = abs(d);
                d = pow(0.01 / d, 1.01);

                finaleColor += col *  d * c;
            }

            gl_FragColor = vec4(finaleColor, iOpacity);
        }
        `;
  }
}
