const http = require('http');
const fs = require('fs');
const path = require('path');

const dirArg = process.argv[2] || 'playwright-report';
const port = Number(process.argv[3] || 9325);
const baseDir = path.resolve(process.cwd(), dirArg);

if (!fs.existsSync(baseDir)) {
  // eslint-disable-next-line no-console
  console.error(`Directory not found: ${baseDir}`);
  process.exit(1);
}

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

const server = http.createServer((req, res) => {
  const reqPath = decodeURIComponent((req.url || '/').split('?')[0]);
  const filePath = path.join(baseDir, reqPath === '/' ? 'index.html' : reqPath);
  const safePath = path.resolve(filePath);

  if (!safePath.startsWith(baseDir)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(safePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    const ext = path.extname(safePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    // eslint-disable-next-line no-console
    console.log(`Port ${port} is already in use.`);
    // eslint-disable-next-line no-console
    console.log(`If the report is already running, open: http://localhost:${port}`);
    process.exit(0);
  }
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Report available: http://localhost:${port}`);
  // eslint-disable-next-line no-console
  console.log(`Serving directory: ${dirArg}`);
});
