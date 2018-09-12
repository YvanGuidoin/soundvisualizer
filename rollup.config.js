import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import sourceMaps from "rollup-plugin-sourcemaps";
import typescript from "rollup-plugin-typescript2";
import babel from "rollup-plugin-babel";

import pkg from "./package.json";

export default {
    input: "src/index.tsx",
    output: {
      file: pkg.module,
      format: "es",
      sourcemap: true,
    },
    external: ["react", "react-dom"],
    watch: {
      include: "src/**/*",
    },
    plugins: [
      // Compile TypeScript files
      typescript({
        useTsconfigDeclarationDir: true,
        outDir: "dist",
        module: "ESNext",
        clean: true,
        baseUrl: "./src/",
        rollupCommonJSResolveHack: true,
      }),
      babel({
        babelrc: false,
        presets: [
          [
            "@babel/env",
            {
              modules: false,
              useBuiltIns: "entry",
              loose: true,
            },
          ],
          "@babel/react",
        ],
        plugins: [],
        exclude: ["node_modules/**"],
      }),
      // Allow bundling cjs modules (unlike webpack, rollup doesn't understand cjs)
      commonjs(),
      // Allow node_modules resolution, so you can use 'external' to control
      // which external modules to include in the bundle
      // https://github.com/rollup/rollup-plugin-node-resolve#usage
      resolve(),
      sourceMaps(),
    ],
}

