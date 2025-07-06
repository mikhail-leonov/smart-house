/**
 * SmartHub - AI powered Smart Home
 * HTTP server App 
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.7.4
 * @license MIT
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const common = require('../Shared/common-node');

const PORT = 8081;

http.createServer((req, res) => {
	let filePath = './public' + req.url;
	if (filePath === './public/') { filePath = './public/index.html' };

	const ext = path.extname(filePath).toLowerCase();
	const mimeTypes = common.mimeTypes;
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
	console.log(`Server running at http://rnd.jarvis.home:${PORT}/`);
});
