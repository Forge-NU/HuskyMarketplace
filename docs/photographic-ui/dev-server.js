"use strict";

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const root = __dirname;

const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon"
};

http.createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405).end();
    return;
  }

  let pathname;

  try {
    pathname = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname
    );
  } catch {
    res.writeHead(400).end();
    return;
  }

  // husky-home-redirect: preserve index.html but use the polished front page.
  if (pathname === "/" || pathname === "/index.html") {
    res.writeHead(302, { Location: "/home.html" }).end();
    return;
  }

  const target = path.resolve(root, "." + pathname);

  if (!target.startsWith(root + path.sep)) {
    res.writeHead(403).end();
    return;
  }

  fs.readFile(target, (error, body) => {
    if (error) {
      res.writeHead(404).end("Not found");
      return;
    }

    const extension = path.extname(target);
    const text = [".html", ".js", ".css", ".svg"].includes(extension);

    res.writeHead(200, {
      "Content-Type": (types[extension] || "application/octet-stream") +
        (text ? "; charset=utf-8" : ""),
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store"
    });

    res.end(req.method === "HEAD" ? undefined : body);
  });
}).listen(5500, "127.0.0.1", () => {
  console.log("Husky Marketplace running at http://127.0.0.1:5500");
});
