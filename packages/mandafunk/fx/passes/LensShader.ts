/**
 * Lens distortion post-processing shader.
 * Simulates barrel/pincushion lens distortion with configurable strength.
 */
export const LensShader = {
  uniforms: {
    tDiffuse: { type: "t", value: null },
    strength: { type: "f", value: 0 },
    height: { type: "f", value: 1 },
    aspectRatio: { type: "f", value: 1 },
    cylindricalRatio: { type: "f", value: 1 },
  },

  vertexShader: [
    "uniform float strength;",
    "uniform float height;",
    "uniform float aspectRatio;",
    "uniform float cylindricalRatio;",

    "varying vec3 vUV;",
    "varying vec2 vUVDot;",

    "void main() {",
    "gl_Position = projectionMatrix * (modelViewMatrix * vec4(position, 1.0));",

    "float scaledHeight = strength * height;",
    "float cylAspectRatio = aspectRatio * cylindricalRatio;",
    "float aspectDiagSq = aspectRatio * aspectRatio + 1.0;",
    "float diagSq = scaledHeight * scaledHeight * aspectDiagSq;",
    "vec2 signedUV = (2.0 * uv + vec2(-1.0, -1.0));",

    "float z = 0.5 * sqrt(diagSq + 1.0) + 0.5;",
    "float ny = (z - 1.0) / (cylAspectRatio * cylAspectRatio + 1.0);",

    "vUVDot = sqrt(ny) * vec2(cylAspectRatio, 1.0) * signedUV;",
    "vUV = vec3(0.5, 0.5, 1.0) * z + vec3(-0.5, -0.5, 0.0);",
    "vUV.xy += uv;",
    "}",
  ].join("\n"),

  fragmentShader: [
    "uniform sampler2D tDiffuse;",
    "varying vec3 vUV;",
    "varying vec2 vUVDot;",

    "void main() {",
    "vec3 uv = dot(vUVDot, vUVDot) * vec3(-0.5, -0.5, -1.0) + vUV;",
    "gl_FragColor = texture2DProj(tDiffuse, uv);",
    "}",
  ].join("\n"),
};
