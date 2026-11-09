import { readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(join(dirname(fileURLToPath(import.meta.url)), ".."));
const PORT = Number(process.env.PORT) || 5173;

const MIME = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".cjs": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".ico": "image/x-icon",
    ".map": "application/json; charset=utf-8",
};

createServer(async (req, res) => {
    try {
        const url = decodeURIComponent(new URL(req.url, `http://localhost:${PORT}`).pathname);
        let path = normalize(join(root, url));
        if (!path.startsWith(root)) {
            res.writeHead(403);
            return res.end("Forbidden");
        }
        const isDir = await stat(path)
            .then(s => s.isDirectory())
            .catch(() => false);
        if (isDir) path = join(path, "index.html");
        const data = await readFile(path);
        res.writeHead(200, { "Content-Type": MIME[extname(path).toLowerCase()] || "application/octet-stream" });
        res.end(data);
    } catch (err) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end(`404 — ${err.message}\n\nMake sure you ran \`npm run build\` first.`);
    }
}).listen(PORT, () => {
    console.log(`\n  ❄️  whiteout demo → http://localhost:${PORT}/demo/\n`);
});

function dirname(p) {
    return p.slice(0, Math.max(p.lastIndexOf("/"), p.lastIndexOf("\\")));
}
