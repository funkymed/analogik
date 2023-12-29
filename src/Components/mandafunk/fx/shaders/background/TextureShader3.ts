import { ShaderAbstract } from './ShaderAbstract.ts'

export class TextureShader3 extends ShaderAbstract {
    constructor() {
        super()

        this.fshader += `
        void main( void ) {
        
          vec2 position = -1.0 + 2.0 * vUv;
          vec2 p = -1.0+2.0*gl_FragCoord.xy/iResolution.y;
      
          float an = iTime*0.1;
      
          p = mat2(cos(an),-sin(an),sin(an),cos(an)) * p;
      
          vec2 uv = vec2(p.x,2.0)/abs(p.y) + iTime;
      
          gl_FragColor = vec4( texture2D(iChannel0, 0.2*uv).xyz*abs(p.y), iOpacity);
        
        }
        `
    }
}
