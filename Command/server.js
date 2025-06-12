/**
 * SmartHub - AI powered Smart Home
 * HTTP server App 
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.7.2
 * @license MIT
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8091;

// Dummy command function (replace with your actual logic)
function handleCommand(command) {
  console.log(`Executing command: ${command}`);
  // Add your smart home logic here
}

http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  if (pathname === '/command') {
    const command = parsedUrl.query.c;

    if (!command) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Missing command parameter "c"');
      return;
    }

    handleCommand(command);

    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(`Command received: ${command}`);
    return;
  }

  // Serve static files
  let filePath = '.' + pathname;
  if (filePath === './') filePath = './index.html';

  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.ico': 'image/x-icon',
  };

  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(err.code === 'ENOENT' ? 404 : 500, { 'Content-Type': 'text/plain' });
      res.end(err.code === 'ENOENT' ? '404 Not Found' : 'Server Error');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
}).listen(PORT, () => {
  console.log(`Server running at http://command.jarvis.home:${PORT}/`);
});
