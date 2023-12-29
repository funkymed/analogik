import { ShaderAbstract } from './ShaderAbstract.ts'

export class FrequencyShader extends ShaderAbstract {
    constructor() {
        super()
        
        this.fshader += `
        vec3 B2_spline(vec3 x) { // returns 3 B-spline functions of degree 2
            vec3 t = 3.0 * x;
            vec3 b0 = step(0.0, t)     * step(0.0, 1.0-t);
            vec3 b1 = step(0.0, t-1.0) * step(0.0, 2.0-t);
            vec3 b2 = step(0.0, t-2.0) * step(0.0, 3.0-t);
            return 0.5 * (
                b0 * pow(t, vec3(2.0)) +
                b1 * (-2.0*pow(t, vec3(2.0)) + 6.0*t - 3.0) + 
                b2 * pow(3.0-t,vec3(2.0))
            );
        }
        
        void main( void )
        {
            // create pixel coordinates
            vec2 uv = (vUv*iResolution.xy) / iResolution.xy;
        
            float fVBars = 100.;
            float fHSpacing = 1.00;
            
            float fHFreq = (uv.x * 3.14);
            float squarewave = sign(sin(fHFreq*fVBars)+1.0-fHSpacing);
            
            float x = floor(uv.x * fVBars)/fVBars;
            float fSample = texture( iChannel1, vec2(abs(2.0 * x - 1.0), 0.25)).x;
          
            float fft = squarewave * fSample* 0.5;
            
            float fHBars = 100.0;
            float fVSpacing = 0.180;
            float fVFreq = (uv.y * 3.14);
            fVFreq = sign(sin(fVFreq * fHBars)+1.0-fVSpacing);
        
            vec2 centered = vec2(1.0) * uv - vec2(1.0);
            float t = iTime / 100.0;
            float polychrome = 1.0;
            vec3 spline_args = fract(vec3(polychrome*uv.x-t) + vec3(0.0, -1.0/3.0, -2.0/3.0));
            vec3 spline = B2_spline(spline_args);
            
            float f = abs(centered.y);
            vec3 base_color  = vec3(1.0, 1.0, 1.0) - f*spline;
            vec3 flame_color = pow(base_color, vec3(3.0));
            
            float tt = 0.3 - uv.y;
            float df = sign(tt);
            df = (df + 1.0)/0.5;
            vec3 col = flame_color * vec3(1.0 - step(fft, abs(0.3-uv.y))) * vec3(fVFreq);
            col -= col * df * 0.180;
            
            // output final color
            gl_FragColor = vec4(col,iOpacity);
        }
        `
    }

}
