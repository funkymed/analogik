import { ShaderAbstract } from '../ShaderAbstract'

export class ColorShader2 extends ShaderAbstract {
    constructor() {
        super()

        this.fshader+= `
        void main( void ) {

          vec2 position = -1.0 + 2.0 * vUv;

          float red = abs( sin( position.x * position.y + iTime / 5.0 ) );
          float green = abs( sin( position.x * position.y + iTime / 4.0 ) );
          float blue = abs( sin( position.x * position.y + iTime / 3.0 ) );
          gl_FragColor = vec4( red, green, blue, iOpacity );

        }
        `
    }
}
