import { ShaderAbstract } from './ShaderAbstract.ts'

export class IceShader extends ShaderAbstract {
    constructor() {
        super()

        this.fshader += `
        precision highp float;

        mat2 rot(float a) {
            float c = cos(a), s = sin(a);
            return mat2(c,s,-s,c);
        }
        
        const float pi = acos(-1.0);
        const float pi2 = pi*2.0;
        
        vec2 pmod(vec2 p, float r) {
            float a = atan(p.x, p.y) + pi/r;
            float n = pi2 / r;
            a = floor(a/n)*n;
            return p*rot(-a);
        }
        
        float box( vec3 p, vec3 b ) {
            vec3 d = abs(p) - b;
            return min(max(d.x,max(d.y,d.z)),0.0) + length(max(d,0.0));
        }
        
        float ifsBox(vec3 p) {
            for (int i=0; i<8; i++) {
                p = abs(p) - 1.0;
                p.xy *= rot(iTime*0.3);
                p.xz *= rot(iTime*0.1);
            }
            p.xz *= rot(iTime);
            return box(p, vec3(0.4,0.8,0.3));
        }
        
        float map(vec3 p, vec3 cPos) {
            vec3 p1 = p;
            p1.x = mod(p1.x-5., 10.) - 5.;
            p1.y = mod(p1.y-5., 10.) - 5.;
            p1.z = mod(p1.z, 24.)-8.;
            p1.xy = pmod(p1.xy, 8.0);
            return ifsBox(p1);
        }
        
        void main(void ) {
            vec2 p = ((vUv.xy*iResolution.xy) *2.0 - iResolution.xy) / min(iResolution.x, iResolution.y);
        
            vec3 cPos = vec3(0.0,0.0, -2.0 * iTime);
            // vec3 cPos = vec3(0.3*sin(iTime*0.8), 0.4*cos(iTime*0.3), -6.0 * iTime);
            vec3 cDir = normalize(vec3(0.0, 0.0, -1.0));
            vec3 cUp  = vec3(sin(iTime), 1.0, 0.0);
            vec3 cSide = cross(cDir, cUp);
        
            vec3 ray = normalize(cSide * p.x + cUp * p.y + cDir);
        
            // Phantom Mode https://www.shadertoy.com/view/MtScWW by aiekick
            float acc = 0.0;
            float acc2 = 0.0;
            float t = 0.0;
            for (int i = 0; i < 24; i++) {
                vec3 pos = cPos + ray * t;
                float dist = map(pos, cPos);
                dist = max(abs(dist), 0.01);
                float a = exp(-dist*4.0);
                if (mod(length(pos)+16.0*iTime, 16.0) < 4.0) {
                    a *= 4.0;
                    acc2 += a;
                }
                acc += a;
                t += dist * 1.0;
            }
        
            vec3 col = vec3(acc * 0.01, acc * 0.011 + acc2*0.002, acc * 0.02+ acc2*0.05);
            gl_FragColor = vec4(col, iOpacity - t * 0.03);
        }
        `
    }

}
