import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "client/index": "src/client/index.ts",
    "transformers/index": "src/transformers/index.ts",
    "types/index": "src/types/index.ts",
  },
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  splitting: false,
  treeshake: true,
  sourcemap: true,
  minify: false,
  banner: {
    js: '"use client";',
  },
  external: ["react", "react-dom", "next", "next/script", "next/navigation"],
});

