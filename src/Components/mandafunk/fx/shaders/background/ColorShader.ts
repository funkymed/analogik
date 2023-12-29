import { ShaderAbstract } from './ShaderAbstract.ts'

export class ColorShader extends ShaderAbstract {
    constructor() {
        super()
        
        this.fshader+= `
            void main(void)
            {
                // Normalized pixel coordinates (from 0 to 1)

                // iTime varying pixel color
                vec3 col = 0.5 + 0.5*cos(iTime+vUv.xyx+vec3(0,2,4));

                // Output to screen
                gl_FragColor = vec4(col,iOpacity);
            }
        `
    }
}
