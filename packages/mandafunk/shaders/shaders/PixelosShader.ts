import { ShaderAbstract } from '../ShaderAbstract'

export class PixelosShader extends ShaderAbstract {
    constructor() {
        super()

        this.fshader += `
        // Code by Flopine

        // Thanks to wsmind, leon, XT95, lsdlive, lamogui,
        // Coyhot, Alkama,YX, NuSan and slerpy for teaching me

        // Thanks LJ for giving me the spark :3

        // Thanks to the Cookie Collective, which build a cozy and safe environment for me
        // and other to sprout :)  https://twitter.com/CookieDemoparty


        #define mo(puv,d) puv=abs(puv)-d;if(puv.y>puv.x) puv=puv.yx
        #define circ(puv,s) (length(puv)-s)
        #define TAU 6.283185
        #define pal(c,t,d) (vec3(0.5)+vec3(0.5)*cos(TAU*(c*t+d)))
        #define dt(speed,off) fract(iTime*speed+off)
        #define switanim(sp) floor(sin(dt(sp,0.)*TAU)+1.)
        #define BPM (97./60.)
        #define rot(a) mat2(cos(a),sin(a),-sin(a),cos(a))

        void moda (inout vec2 uv, float rep)
        {
            float per = TAU/rep;
            float a = mod(atan(uv.y,uv.x),per)-per*0.5;
            uv = vec2(cos(a),sin(a))*length(uv);
        }

        float frame (vec2 uv)
        {
            vec2 uu = uv;

            float f = smoothstep(0.05+texture(iChannel1, vec2(0.001,0.25)).x*0.2,0.01, abs(circ(uv,0.5)));

            moda(uv,12.);
            mo(uv, vec2(0.55));
            uv.y -= sin(uv.x*2.)*0.2;
            f+= texture(iChannel1, vec2((uv.x+uv.y)*0.2,0.25)).x*1.75;

            moda(uu, 5.);
            mo(uu,vec2(0.9));
            for(int i=0; i<4;i++)
            {
                float ratio = float(i)/4. ;
                uu.x -= 1.;
                uu *= rot(dt(0.05,ratio*2.)*TAU);
                f += smoothstep(0.1,0.09, abs(uu.x))*0.7;
            }
            return f;
        }

        void main (void)
        {
            vec2 uv = (2.*(vUv*iResolution.xy)-iResolution.xy)/iResolution.y;

            float detail = 60.*texture(iChannel1, vec2(0.0001,0.25)).x*1.5;
            uv = floor(uv*detail)/detail;

            float size = (switanim(BPM/2.)<0.5) ? 1.: 5.;

            vec3 col = frame(uv*size)*pal(length(uv),vec3(0.8),vec3(0.,0.32,0.32));

            gl_FragColor = vec4(sqrt(col),iOpacity);
        }
        `
    }
}
