import { ShaderAbstract } from '../ShaderAbstract'

export class TextureShader extends ShaderAbstract {
    constructor() {
        super()

        this.fshader += `
        vec3 sqr( vec3 x ) { return x*x; }
        void main(void)
        {
            vec2 p = -1.0 + 2.0 * gl_FragCoord.xy / iResolution.xy/2.0;
            float a = atan(p.y,p.x);
            float r = sqrt(dot(p,p));
            float s = r * (1.0+0.5*cos(iTime*0.5));

            vec2 uv = sin(iTime/100.)*1.02*p;
            uv.x +=                  .03*cos(-iTime+a*4.0)/s;
            uv.y += .02*iTime +.03*sin(-iTime+a*4.0)/s;
            uv.y += r*r*0.025*sin(2.0*r);

            vec3 col = texture2D( iChannel0, sin(iTime/100.)*0.5*uv).xyz  * vec3(1.0,0.8,0.6);
            col += sqr(texture2D( iChannel0, sin(iTime/10.)*5.0*uv).xxx) * vec3(0.7,1.0,1.0);

            float w = 2.0*r;
            w *= 0.5 + 0.5*pow(clamp(1.0-0.75*r,0.0,1.0),0.5);

            gl_FragColor = vec4(col*w,iOpacity);
        }
        `
    }
}
