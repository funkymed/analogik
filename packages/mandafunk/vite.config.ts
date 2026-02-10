import { defineConfig } from "vite";
import { resolve } from "path";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    dts({
      include: ["index.ts", "config/**/*.ts", "core/**/*.ts", "fx/**/*.ts", "shaders/**/*.ts"],
      rollupTypes: false,
    }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, "index.ts"),
        "config/index": resolve(__dirname, "config/index.ts"),
        "core/MandaRenderer": resolve(__dirname, "core/MandaRenderer.ts"),
      },
      formats: ["es", "cjs"],
    },
    rollupOptions: {
      external: ["three", "react", /^three\//],
      output: {
        preserveModules: false,
        globals: {
          three: "THREE",
          react: "React",
        },
      },
    },
    sourcemap: true,
    minify: false,
    outDir: "dist",
  },
});
