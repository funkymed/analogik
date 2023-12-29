import { ShaderAbstract } from './ShaderAbstract.ts'

export class TextureShader2 extends ShaderAbstract {
    constructor() {
        super()

        this.fshader += `
        void main( void ) {
        
          vec2 position = -1.0 + 2.0 * vUv;
        
          float a = atan( position.y, position.x );
          float r = sqrt( dot( position, position ) );
        
          vec2 uv;
          uv.x = cos( a ) / r;
          uv.y = sin( a ) / r;
          uv /= 10.0;
          uv += iTime * 0.05;
        
          vec3 color = texture2D( iChannel0, uv ).rgb;
        
          gl_FragColor = vec4( color * r * 5., iOpacity );
        
        }
        `
    }

}
