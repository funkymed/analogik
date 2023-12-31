import { ShaderAbstract } from './ShaderAbstract.ts'

export class FractalShader2 extends ShaderAbstract {
    constructor() {
        super()
        
        this.fshader += `
            #define rot(a) mat2(cos(a),sin(a),-sin(a),cos(a))

            vec3 render(vec2 p) {
                p*=rot(iTime*.1)*(.0002+.7*pow(smoothstep(0.,.5,abs(.5-fract(iTime*.01))),3.));
                p.y-=.2266;
                p.x+=.2082;
                vec2 ot=vec2(100.);
                float m=100.;
                for (int i=0; i<150; i++) {
                    vec2 cp=vec2(p.x,-p.y);
                    p=p+cp/dot(p,p)-vec2(0.,.25);
                    p*=.1;
                    p*=rot(1.5);
                    ot=min(ot,abs(p)+.15*fract(max(abs(p.x),abs(p.y))*.25+iTime*.1+float(i)*.15));
                    m=min(m,abs(p.y));
                }
                ot=exp(-200.*ot)*2.;
                m=exp(-200.*m);
                return vec3(ot.x,ot.y*.5+ot.x*.3,ot.y)+m*.2;
            }
            
            void main( void )
            {
                vec2 uv = ((vUv*iResolution.xy)-iResolution.xy*.5)/iResolution.y;
                vec2 d=vec2(0.,.5)/iResolution.xy;
                vec3 col = render(uv)+render(uv+d.xy)+render(uv-d.xy)+render(uv+d.yx)+render(uv-d.yx);
                gl_FragColor = vec4(col*.2,1.0);
            }

        `
    }
}
