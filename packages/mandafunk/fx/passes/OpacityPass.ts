/**
 * Final opacity post-processing shader.
 * Multiplies the entire composited output by a single opacity uniform,
 * fading the scene toward black when opacity < 1.
 */
export const OpacityShader = {
  uniforms: {
    tDiffuse: { type: "t", value: null },
    uOpacity: { type: "f", value: 1.0 },
  },

  vertexShader: [
    "varying vec2 vUv;",
    "void main() {",
    "  vUv = uv;",
    "  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
    "}",
  ].join("\n"),

  fragmentShader: [
    "uniform sampler2D tDiffuse;",
    "uniform float uOpacity;",
    "varying vec2 vUv;",
    "void main() {",
    "  vec4 color = texture2D(tDiffuse, vUv);",
    "  gl_FragColor = color * uOpacity;",
    "}",
  ].join("\n"),
};
