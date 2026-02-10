import { ShaderAbstract } from '../ShaderAbstract'

export class BubbleShader extends ShaderAbstract {
    constructor() {
        super()

        this.fshader+= `
            const float MATH_PI	= float( 3.14159265359 );

            void Rotate( inout vec2 p, float a )
            {
                p = cos( a ) * p + sin( a ) * vec2( p.y, -p.x );
            }

            float Circle( vec2 p, float r )
            {
                return ( length( p / r ) - 1.0 ) * r;
            }

            float Rand( vec2 c )
            {
                return fract( sin( dot( c.xy, vec2( 12.9898, 78.233 ) ) ) * 43758.5453 );
            }

            float saturate( float x )
            {
                return clamp( x, 0.0, 1.0 );
            }

            void BokehLayer( inout vec3 color, vec2 p, vec3 c )
            {
                float wrap = 450.0;
                if ( mod( floor( p.y / wrap + 0.5 ), 2.0 ) == 0.0 )
                {
                    p.x += wrap * 0.5;
                }

                vec2 p2 = mod( p + 0.5 * wrap, wrap ) - 0.5 * wrap;
                vec2 cell = floor( p / wrap + 0.5 );
                float cellR = Rand( cell );

                c *= fract( cellR * 3.33 + 3.33 );
                float radius = mix( 30.0, 70.0, fract( cellR * 7.77 + 7.77 ) );
                p2.x *= mix( 0.9, 1.1, fract( cellR * 11.13 + 11.13 ) );
                p2.y *= mix( 0.9, 1.1, fract( cellR * 17.17 + 17.17 ) );

                float sdf = Circle( p2, radius );
                float circle = 1.0 - smoothstep( 0.0, 1.0, sdf * 0.04 );
                float glow	 = exp( -sdf * 0.025 ) * 0.3 * ( 1.0 - circle );
                color += c * ( circle + glow );
            }

            void main( void )
            {
                vec2 uv = (vUv*iResolution.xy) / iResolution.xy;
                vec2 p = ( 2.0 * (vUv*iResolution.xy) - iResolution.xy ) / iResolution.x * 1000.0;

                // background
                vec3 color = mix( vec3( 0.3, 0.1, 0.3 ), vec3( 0.1, 0.4, 0.5 ), dot( uv, vec2( 0.2, 0.7 ) ) );

                float iTime = iTime - 15.0;

                Rotate( p, 0.2 + iTime * 0.03 );
                BokehLayer( color, p + vec2( -50.0 * iTime +  0.0, 0.0  ), 3.0 * vec3( 0.4, 0.1, 0.2 ) );
                Rotate( p, 0.3 - iTime * 0.05 );
                BokehLayer( color, p + vec2( -70.0 * iTime + 33.0, -33.0 ), 3.5 * vec3( 0.6, 0.4, 0.2 ) );
                Rotate( p, 0.5 + iTime * 0.07 );
                BokehLayer( color, p + vec2( -60.0 * iTime + 55.0, 55.0 ), 3.0 * vec3( 0.4, 0.3, 0.2 ) );
                Rotate( p, 0.9 - iTime * 0.03 );
                BokehLayer( color, p + vec2( -25.0 * iTime + 77.0, 77.0 ), 3.0 * vec3( 0.4, 0.2, 0.1 ) );
                Rotate( p, 0.0 + iTime * 0.05 );
                BokehLayer( color, p + vec2( -15.0 * iTime + 99.0, 99.0 ), 3.0 * vec3( 0.2, 0.0, 0.4 ) );

                gl_FragColor = vec4( color, iOpacity );
            }
        `
    }
}
