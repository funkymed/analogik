import { ShaderAbstract } from './ShaderAbstract.ts'

export class PlasmaShader3 extends ShaderAbstract {
    constructor() {
        super()

        this.fshader+= `
        // Mark Serdtse
        // Variation of distance field explanation 
        // from https://thebookofshaders.com/07/?lan=ru
        
        void main( void )
        {
          vec2 st = (vUv*iResolution.xy)/iResolution.xy;
            
          st.x -= 0.2; 
          st.x *= iResolution.x/iResolution.y;
            
          vec3 color = 0.5 + 0.5*cos(iTime+st.xyx+vec3(0,2,4));
          float d = 0.0;
            
          st = st *2.-1.;
            
          float sin_factor = sin(iTime/5.);
          float cos_factor = cos(iTime/5.);
            
          st = st* mat2(cos_factor, sin_factor, -sin_factor, cos_factor);
            
        
          d = length(abs(sin(abs(st*2.)+iTime))*(sin(abs(cos(st.x)*sin(st*5.))*.8)/2.));
        
            
          float mask = sin(d*50.0);
              
          color = color*mask;
            
          gl_FragColor = vec4(color,iOpacity);
        
        }
        `
    }
}
