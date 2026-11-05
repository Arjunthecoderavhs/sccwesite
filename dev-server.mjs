// Local preview: node dev-server.mjs  (reads .env if present) -> http://localhost:3000
import http from "node:http";
import { promises as fs, readFileSync, existsSync } from "node:fs";
import path from "node:path";

if (existsSync(".env")) {
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

process.env.SCC_LOCAL_DEV = "1";

const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon", ".json": "application/json" };
const PORT = Number(process.env.PORT) || 3000;

http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  try {
    if (url.pathname.startsWith("/api/")) {
      const name = url.pathname.slice(5).replace(/[^a-z-]/g, "");
      const mod = await import(`./api/${name}.js`);
      return await mod.default(req, res);
    }
    let file = path.join("public", path.normalize(url.pathname).replace(/^(\.\.[/\\])+/, ""));
    if (url.pathname.endsWith("/")) file = path.join(file, "index.html");
    const data = await fs.readFile(file);
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
    res.end(data);
  } catch (e) {
    res.writeHead(e.code === "ENOENT" || e.code === "ERR_MODULE_NOT_FOUND" ? 404 : 500, { "Content-Type": "text/plain" });
    res.end(e.code === "ENOENT" ? "Not found" : String(e.message));
  }
}).listen(PORT, () => console.log(`SCC site on http://localhost:${PORT}`));
