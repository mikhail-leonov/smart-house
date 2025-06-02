/**
 * SmartHub - AI powered Smart Home
 * Web server which is waiting messages via /message endpoint and send it to telegram
 * GitHub: https://github.com/mikhail-leonov/smart-house
 *
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.6.6
 * @license MIT
 */

const http = require('http');
const axios = require('axios');
const url = require('url');

const environment = require('../Shared/env-node');

const env = environment.load();
const apiUrl = env.telegram.apiUrl;
const chatid = env.telegram.chatid; 

const PORT = 8080;

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url.startsWith('/send')) {
    const query = new URL(req.url, `http://${req.headers.host}`).searchParams;
    const message = query.get('message');

    if (!message || !message.trim()) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Missing or empty message');
      return;
    }

    axios.post(apiUrl, {
      chat_id: chatid,
      text: message.trim()
    })
    .then(() => {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('Message sent to Telegram');
    })
    .catch(err => {
      console.error('Telegram error:', err.response?.data || err.message);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Failed to send Telegram message');
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`Telegram GET server listening on http://localhost:${PORT}/send?message=YourText`);
});
