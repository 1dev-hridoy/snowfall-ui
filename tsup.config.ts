import { defineConfig } from "tsup";

export default defineConfig([
    {
        entry: {
            index: "src/index.ts",
            vanilla: "src/vanilla.ts",
        },
        format: ["esm", "cjs"],
        dts: true,
        splitting: true,
        treeshake: true,
        clean: true,
        sourcemap: true,
        external: ["react", "react-dom", "react/jsx-runtime"],
    },
    {
        entry: {
            "react/index": "src/react/index.ts",
        },
        format: ["esm", "cjs"],
        dts: true,
        treeshake: true,
        sourcemap: true,
        external: ["react", "react-dom", "react/jsx-runtime"],
    },
]);
