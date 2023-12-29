import { ShaderAbstract } from './ShaderAbstract.ts'

export class SpectrumShader extends ShaderAbstract {
    constructor() {
        super()

        this.fshader += `
        void main( void )
        {
            // Define some options
            const float stepCount = 128.0;
            float barWidth = iResolution.x / stepCount;
        
            // Set background color
            vec3 color = vec3(0.1, 0.1, 0.1);
        
            // Draw spectrum bars
            float isInsideBar = step((vUv*iResolution.xy).y/iResolution.y, texture( iChannel1, vec2(floor((vUv*iResolution.xy).x / barWidth)/stepCount,0.25) ).x);
            color = vec3(1.0) * isInsideBar;
            color *= vec3((1.0/stepCount)*floor((vUv*iResolution.xy).x / barWidth),1.0-(1.0/stepCount)*floor((vUv*iResolution.xy).y / barWidth),0.5);
            color = color * 0.90 + 0.1;
        
            // Set the final fragment color
            gl_FragColor = vec4(color, 1.0);
        }
        `
    }
}
