import { ShaderAbstract } from './ShaderAbstract.ts'

export class StrangeShader extends ShaderAbstract {
    constructor() {
        super()
        
        this.fshader += `
            // The MIT License
            // Copyright © 2013 Inigo Quilez
            // Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
            // https://www.youtube.com/c/InigoQuilez
            // https://iquilezles.org
            
            
            // List of ray-surface intersectors at https://www.shadertoy.com/playlist/l3dXRf
            //
            // and https://iquilezles.org/articles/intersectors
            
            
            #if 1
            //
            // Elegant way to intersect a planar coordinate system (3x3 linear system)
            //
            vec3 intersectCoordSys( in vec3 ro, in vec3 rd, vec3 dc, vec3 du, vec3 dv )
            {
                vec3 oc = ro - dc;
                return vec3(
                    dot( cross(du,dv), oc ),
                    dot( cross(oc,du), rd ),
                    dot( cross(dv,oc), rd ) ) / 
                    dot( cross(dv,du), rd );
            }
            
            #else
            //
            // Ugly (but faster) way to intersect a planar coordinate system: plane + projection
            //
            vec3 intersectCoordSys( in vec3 ro, in vec3 rd, vec3 dc, vec3 du, vec3 dv )
            {
                vec3  oc = ro - dc;
                vec3  no = cross(du,dv);
                float t  = -dot(no,oc)/dot(rd,no);
                float r  =  dot(du,oc + rd*t);
                float s  =  dot(dv,oc + rd*t);
                return vec3(t,s,r);
            }
            
            #endif	
            
            vec3 hash3( float n )
            {
                return fract(sin(vec3(n,n+1.0,n+2.0))*vec3(43758.5453123,12578.1459123,19642.3490423));
            }
            
            vec3 shade( in vec4 res )
            {
                float ra = length(res.yz);
                float an = atan(res.y,res.z) + 2.0*iTime;
                float pa = sin(3.0*an);
            
                vec3 cola = 0.5 + 0.5*sin( (res.w/32.0)*3.5 + vec3(0.0,1.0,2.0) );
                
                vec3 col = vec3(0.0);
                col += cola*0.4*(1.0-smoothstep( 0.90, 1.00, ra) );
                col += cola*1.0*(1.0-smoothstep( 0.00, 0.03, abs(ra-0.8)))*(0.5+0.5*pa);
                col += cola*1.0*(1.0-smoothstep( 0.00, 0.20, abs(ra-0.8)))*(0.5+0.5*pa);
                col += cola*0.5*(1.0-smoothstep( 0.05, 0.10, abs(ra-0.5)))*(0.5+0.5*pa);
                col += cola*0.7*(1.0-smoothstep( 0.00, 0.30, abs(ra-0.5)))*(0.5+0.5*pa);
            
                return col*0.3;
            }
            
            vec3 render( in vec3 ro, in vec3 rd )
            {
                  // raytrace
                vec3 col = vec3( 0.0 );
                for( int i=0; i<32; i++ )
                {
                    // position disk
                    vec3 r = 1.5*(-1.0 + 2.0*hash3( float(i) ));
                    
                    // orientate disk
                    vec3 u = normalize( r.zxy );
                    vec3 v = normalize( cross( u, vec3(0.0,1.0,0.0 ) ) );						   
                    
                    // intersect coord sys
                    vec3 tmp = intersectCoordSys( ro, rd, r, u, v );
                
                    if( dot(tmp.yz,tmp.yz)<1.0 && tmp.x>0.0 ) 
                    {
                        // shade			
                        col += shade( vec4(tmp,float(i)) );
                    }
                }
            
                return col;
            }
            
            void main( void )
            {
                vec2 p = (2.0*(vUv*iResolution.xy)-iResolution.xy)/iResolution.y;
            
                // camera
                vec3 ro = 1.5*vec3(cos(0.05*iTime),0.0,sin(0.05*iTime));
                vec3 ta = vec3(0.0,0.0,0.0);
                // camera matrix
                vec3 ww = normalize( ta - ro );
                vec3 uu = normalize( cross(ww,vec3(0.0,1.0,0.0) ) );
                vec3 vv = normalize( cross(uu,ww));
                // create view ray
                vec3 rd = normalize( p.x*uu + p.y*vv + 1.0*ww );
            
                vec3 col = render( ro, rd );
                
                gl_FragColor = vec4( col, iOpacity );
            }
            
        `
    }

}
