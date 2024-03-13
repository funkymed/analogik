export const WaterShader = {
  uniforms: {
    tDiffuse: {
      value: null,
    },
    byp: { value: 0 }, //apply the glitch ?
    tex: { type: "t", value: null },
    time: { type: "f", value: 0.0 },
    factor: { type: "f", value: 0.0 },
    resolution: { type: "v2", value: null },
  },

  vertexShader: `varying vec2 vUv;
    void main(){  
      vUv = uv; 
      vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * modelViewPosition;
    }`,

  fragmentShader: `uniform int byp; //should we apply the glitch ?
  uniform float time;
  uniform float factor;
  uniform vec2 resolution;
  uniform sampler2D tDiffuse;
  
  varying vec2 vUv;
  
  void main() {  
    if (byp<1) {
      vec2 uv1 = vUv;
      vec2 uv = gl_FragCoord.xy/resolution.xy;
      float frequency = 6.0;
      float amplitude = 0.015 * factor;
      float x = uv1.y * frequency + time * .7; 
      float y = uv1.x * frequency + time * .3;
      uv1.x += cos(x+y) * amplitude * cos(y);
      uv1.y += sin(x-y) * amplitude * cos(y);
      vec4 rgba = texture2D(tDiffuse, uv1);
      gl_FragColor = rgba;
    } else {
      gl_FragColor = texture2D(tDiffuse, vUv);
    }
  }`,
};
