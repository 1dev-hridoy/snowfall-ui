import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const targets = ["dist/react/index.js", "dist/react/index.cjs"];
const directive = `'use client';`;

let touched = 0;

for (const rel of targets) {
    const filePath = join(root, rel);
    if (!existsSync(filePath)) {
        console.warn(`ensure-use-client: ${rel} not found, skipping`);
        continue;
    }

    const original = readFileSync(filePath, "utf8");

    const stripped = original.replace(/^['"]use client['"];\s*\n?/, "");
    const next = `${directive}\n${stripped}`;
    writeFileSync(filePath, next);

    const mapPath = `${filePath}.map`;
    if (existsSync(mapPath)) {
        const map = JSON.parse(readFileSync(mapPath, "utf8"));
        if (typeof map.mappings === "string") {
            map.mappings = map.mappings.length ? `;${map.mappings}` : ";";
            writeFileSync(mapPath, JSON.stringify(map));
        }
    }

    touched++;
    console.log(`ensure-use-client: prepended directive to ${rel}`);
}

console.log(`ensure-use-client: done (${touched} file(s))`);
