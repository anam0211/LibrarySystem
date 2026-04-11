import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, URL } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const rootDir = path.dirname(currentFile);
const port = Number(process.env.PORT || 5500);
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8",
  ".webp": "image/webp"
};

function sendFile(response, filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[extension] || "application/octet-stream";

  response.writeHead(200, { "Content-Type": contentType });
  fs.createReadStream(filePath).pipe(response);
}

function sendNotFound(response) {
  response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  response.end("404 Not Found");
}

function resolveFilePath(requestPathname) {
  const decodedPath = decodeURIComponent(requestPathname || "/");
  const relativePath = decodedPath === "/" ? "index.html" : decodedPath.replace(/^\/+/, "");
  const filePath = path.resolve(rootDir, relativePath);

  if (!filePath.startsWith(rootDir)) {
    return null;
  }

  return filePath;
}

const server = http.createServer((request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);
  const filePath = resolveFilePath(requestUrl.pathname);

  if (!filePath) {
    sendNotFound(response);
    return;
  }

  fs.stat(filePath, (error, stats) => {
    if (!error && stats.isFile()) {
      sendFile(response, filePath);
      return;
    }

    const extension = path.extname(filePath).toLowerCase();

    if (extension) {
      sendNotFound(response);
      return;
    }

    sendFile(response, path.join(rootDir, "index.html"));
  });
});

server.listen(port, () => {
  console.log(`BookHub frontend server running at http://localhost:${port}`);
});
