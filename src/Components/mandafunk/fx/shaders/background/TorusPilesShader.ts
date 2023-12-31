import { ShaderAbstract } from './ShaderAbstract.ts'

export class TorusPilesShader extends ShaderAbstract {
    constructor() {
        super()
        
        this.fshader+= `
        /*

        Clifford Torus Rotation
        -----------------------
    
        Getting a good distance for this 4D stereographic projection was
        tricky, see the notes in 'Main SDF', or just toggle DEBUG below to
        see what's going on.
    
        Big thanks to Matthew Arcus (mla) for providing a better torus
        equation and improving the projection distance fix.
    
        See also:
    
        * Animation by Jason Hise https://www.youtube.com/watch?v=1_pzjvVixL0
        * Clifford Torus by mla https://www.shadertoy.com/view/3ss3z4
        * https://en.wikipedia.org/wiki/Clifford_torus
        * http://virtualmathmuseum.org/Surface/clifford_torus/clifford_torus.html
    
    */
    
    //#define DEBUG
    
    // --------------------------------------------------------
    // HG_SDF
    // https://www.shadertoy.com/view/Xs3GRB
    // --------------------------------------------------------
    
    #define PI 3.14159265359
    
    void pR(inout vec2 p, float a) {
        p = cos(a)*p + sin(a)*vec2(p.y, -p.x);
    }
    
    vec2 pMod2(inout vec2 p, vec2 size) {
        vec2 c = floor((p + size*0.5)/size);
        p = mod(p + size*0.5,size) - size*0.5;
        return c;
    }
    
    float smax(float a, float b, float r) {
        vec2 u = max(vec2(r + a,r + b), vec2(0));
        return min(-r, max (a, b)) + length(u);
    }
    
    float fTorus(vec3 p, float smallRadius, float largeRadius) {
        return length(vec2(length(p.xz) - largeRadius, p.y)) - smallRadius;
    }
    
    
    // --------------------------------------------------------
    // Spectrum colour palette
    // IQ https://www.shadertoy.com/view/ll2GD3
    // --------------------------------------------------------
    
    vec3 pal( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d ) {
        return a + b*cos( 6.28318*(c*t+d) );
    }
    
    vec3 spectrum(float n) {
        return pal( n, vec3(0.5,0.5,0.5),vec3(0.5,0.5,0.5),vec3(1.0,1.0,1.0),vec3(0.0,0.33,0.67) );
    }
    
    
    // --------------------------------------------------------
    // Main SDF
    // --------------------------------------------------------
    
    // Inverse stereographic projection of p,
    // p4 lies onto the unit 3-sphere centered at 0.
    // - mla https://www.shadertoy.com/view/lsGyzm
    vec4 inverseStereographic(vec3 p, out float k) {
        k = 2.0/(1.0+dot(p,p));
        return vec4(k*p,k-1.0);
    }
    
    float fTorus(vec4 p4, out vec2 uv) {
    
        // Torus distance
        // We want the inside and outside to look the same, so use the
        // inverted outside for the inside.
        float d1 = length(p4.xy) / length(p4.zw) - 1.;
        float d2 = length(p4.zw) / length(p4.xy) - 1.;
        float d = d1 < 0. ? -d1 : d2;
    
        // Because of the projection, distances aren't lipschitz continuous,
        // so scale down the distance at the most warped point - the inside
        // edge of the torus such that it is 1:1 with the domain.
        d /= PI;
    
        // UV coordinates over the surface, from 0 - 1
        uv = (vec2(
            atan(p4.y, p4.x),
            atan(p4.z, p4.w)
        ) / PI) * .5 + .5;
    
        return d;
    }
    
    // Distances get warped by the stereographic projection, this applies
    // some hacky adjustments which makes them lipschitz continuous.
    
    // The numbers have been hand picked by comparing our 4D torus SDF to
    // a usual 3D torus of the same size, see DEBUG.
    
    // vec3 d
    //   SDF to fix, this should be applied after the last step of
    //   modelling on the torus.
    
    // vec3 k
    //   stereographic scale factor
    
    float fixDistance(float d, float k) {
        float sn = sign(d);
        d = abs(d);
        d = d / k * 1.82;
        d += 1.;
        d = pow(d, .5);
        d -= 1.;
        d *= 5./3.;
        d *= sn;
        return d;
    }
    
    float time;
    vec2 modelUv;
    bool hitDebugTorus = false;
    
    float map(vec3 p) {
    
        #ifdef DEBUG
            if (p.x < 0.) {
                hitDebugTorus = true;
                return fTorus(p.xzy, 1., 1.4145);
            }
        #endif
    
        float k;
        vec4 p4 = inverseStereographic(p,k);
    
        // The inside-out rotation puts the torus at a different
        // orientation, so rotate to point it at back in the same
        // direction
        pR(p4.zy, time * -PI / 2.);
    
        // Rotate in 4D, turning the torus inside-out
        pR(p4.xw, time * -PI / 2.);
    
        vec2 uv;
        float d = fTorus(p4, uv);
        modelUv = uv;
    
        #ifdef DEBUG
            d = fixDistance(d, k);
            return d;
        #endif
    
        // Recreate domain to be wrapped around the torus surface
        // xy = surface / face, z = depth / distance
        float uvScale = 2.25; // Magic number that makes xy distances the same scale as z distances
        p = vec3(uv * uvScale, d);
    
        // Draw some repeated circles
    
        float n = 10.;
        float repeat = uvScale / n;
    
        p.xy += repeat / 2.;
        pMod2(p.xy, vec2(repeat));
    
        d = length(p.xy) - repeat * .4;
        d = smax(d, abs(p.z) - .013, .01);
    
        d = fixDistance(d, k);
    
        return d;
    }
    
    bool hitDebugPlane = false;
    
    float mapDebug(vec3 p) {
        float d = map(p);
        #ifndef DEBUG
            return d;
        #endif
        float plane = min(abs(p.z), abs(p.y));
        hitDebugPlane = plane < abs(d);
        //hitDebugPlane = true;
        return hitDebugPlane ? plane : d;
    }
    
    
    // --------------------------------------------------------
    // Rendering
    // --------------------------------------------------------
    
    vec3 calcNormal(vec3 p) {
      vec3 eps = vec3(.0001,0,0);
      vec3 n = vec3(
        map(p + eps.xyy) - map(p - eps.xyy),
        map(p + eps.yxy) - map(p - eps.yxy),
        map(p + eps.yyx) - map(p - eps.yyx)
      );
      return normalize(n);
    }
    
    mat3 calcLookAtMatrix(vec3 ro, vec3 ta, vec3 up) {
        vec3 ww = normalize(ta - ro);
        vec3 uu = normalize(cross(ww,up));
        vec3 vv = normalize(cross(uu,ww));
        return mat3(uu, vv, ww);
    }
    
    const float ITER = 400.;
    const float MAX_DIST = 12.;
    
    void main(void) {
    
        time = mod(iTime / 2., 1.);
        #ifdef DEBUG
            time = iTime / 6.;
        #endif
    
        vec3 camPos = vec3(1.8, 5.5, -5.5);
        vec3 camTar = vec3(.1,0,.1);
        vec3 camUp = vec3(-1,0,-1.5);
        mat3 camMat = calcLookAtMatrix(camPos, camTar, camUp);
    
        float focalLength = 2.4;
        vec2 p = (-iResolution.xy + 2. * (vUv.xy*iResolution.xy)) / iResolution.y;
    
        vec3 rayDirection = normalize(camMat * vec3(p, focalLength));
        vec3 rayOrigin = camPos;
        vec3 rayPosition = rayOrigin;
        float rayLength = 0.;
    
        float distance = 0.;
        vec3 color = vec3(0);
    
        for (float i = 0.; i < ITER; i++) {
            rayLength += distance;
            rayPosition = rayOrigin + rayDirection * rayLength;
            distance = mapDebug(rayPosition);
    
            if (distance < .001) {
                vec3 normal = calcNormal(rayPosition);
                color = vec3(dot(normalize(vec3(1,.5,0)), normal) * .5 + .5);
    
                #ifdef DEBUG
                    if (hitDebugPlane) {
                        // Display distance
                        float d = map(rayPosition);
                        color = vec3(mod(abs(d) * 10., 1.));
                        color *= spectrum(abs(d));
                        color = mix(color, vec3(1), step(0., -d) * .25);
                    } else if ( ! hitDebugTorus) {
                        // Color UVs
                        float repeat = 1. / 20.;
                        pMod2(modelUv, vec2(repeat));
                        color -= color * vec3(0,1,0) * smoothstep(0., .001, abs(modelUv.x) - repeat * .4);
                        color -= color * vec3(1,0,0) * smoothstep(0., .001, abs(modelUv.y) - repeat * .4);
                    }
                #endif
    
                break;
            }
    
            if (rayLength > MAX_DIST) {
                break;
            }
        }
    
        #ifndef DEBUG
            float fog = pow(smoothstep(7.25, MAX_DIST, rayLength), .25);
            color = mix(color, vec3(0), fog);
            color = spectrum((color.r * 2. - 1.) * .2 + .4);
            color *= mix(1., .025, fog);
        #endif
    
        color = pow(color, vec3(1. / 2.2)); // Gamma
        gl_FragColor = vec4(color, iOpacity);
    }
    
        `
    }
}
