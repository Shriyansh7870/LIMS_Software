const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 4000;
const DIST = path.join(__dirname, 'frontend', 'dist');

const MIME = {
  '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.json': 'application/json', '.map': 'application/json',
};

http.createServer((req, res) => {
  let filePath = path.join(DIST, req.url === '/' ? 'index.html' : req.url);

  // SPA fallback — any path without extension → index.html
  if (!path.extname(filePath)) filePath = path.join(DIST, 'index.html');

  fs.readFile(filePath, (err, data) => {
    if (err) {
      // Try index.html as fallback
      fs.readFile(path.join(DIST, 'index.html'), (e2, d2) => {
        if (e2) { res.writeHead(404); return res.end('Not found'); }
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(d2);
      });
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log(`Frontend running at http://localhost:${PORT}`);
});
