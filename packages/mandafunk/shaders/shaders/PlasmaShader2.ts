import { ShaderAbstract } from '../ShaderAbstract'

export class PlasmaShader2 extends ShaderAbstract {
    constructor() {
        super()

        this.fshader += `
        void main(void)
        {
            vec2 uv = gl_FragCoord.xy / iResolution.xy;
            float depth = sin(uv.y*2.0+sin(iTime)*1.5+1.0+sin(uv.x*3.0+iTime*1.2))*cos(uv.y*2.0+iTime)+sin((uv.x*3.0+iTime));
            float texey = (uv.x-0.5);
            float xband = sin(sqrt(uv.y/uv.y)*16.0/(depth)+iTime*3.0);
            float final = (
                sin(texey/abs(depth)*32.0+iTime*16.0+sin(uv.y*uv.x*32.0*sin(depth*3.0)))*(depth)*xband
            );


            gl_FragColor = vec4(-final*abs(sin(iTime)),(-final*sin(iTime)*2.0),(final),iOpacity)*1.5;
        }
        `
    }
}
