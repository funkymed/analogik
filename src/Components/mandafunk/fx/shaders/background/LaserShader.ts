import { ShaderAbstract } from './ShaderAbstract.ts'
export class LaserShader extends ShaderAbstract {
    constructor() {
        super()
        
        this.fshader += `
            precision highp float;

            void main(void)
            {
                vec2 uv = gl_FragCoord.xy / iResolution.xy/2.0;
                
                float n = iTime;
                float x = uv.x+cos(iTime/2.0)/4.0;
                float y = uv.y+sin(iTime/2.0)/6.0;
                
                float xcir = x-0.75;
                float ycir = y-0.25;
                
                float circle = ((xcir*xcir)+(ycir*ycir)/3.0);
                float tunnel = sqrt(circle*0.25)/circle*4.0+n*16.0;
                float wally = sin(atan(xcir/ycir*1.5)*8.0+cos(n/2.0)*32.0*sin(tunnel+n)/4.0+sin(n/3.2)*32.0);

                float shade=clamp(circle*32.0,0.0,1.0);
                float full=(sin(tunnel)*wally);
                gl_FragColor = vec4(full*shade*1.4,(full-0.25)*shade,abs(full+0.5)*shade,iOpacity);
            }
            `
    }
}
