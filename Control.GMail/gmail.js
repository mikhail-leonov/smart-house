/**
 * SmartHub - AI powered Smart Home
 * Web server which is waiting messages via /message endpoint and send it as gmail
 * GitHub: https://github.com/mikhail-leonov/smart-house
 *
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.6.9
 * @license MIT
 */

const http = require('http');
const nodemailer = require('nodemailer');
const environment = require('../Shared/env-node');

const env = environment.load();

const gmailUser = env.mail.mail;
const gmailPass = env.mail.sender;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: gmailUser,
    pass: gmailPass
  }
});

const PORT = 8080;

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url.startsWith('/send')) {
    const query = new URL(req.url, `http://${req.headers.host}`).searchParams;
    const to = query.get('to');
    const subject = query.get('subject') || 'No Subject';
    const message = query.get('message') || '';

    if (!to || !message.trim()) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Missing required parameters: "to" and "message"');
      return;
    }

    const mailOptions = {
      from: gmailUser,
      to,
      subject,
      text: message.trim()
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Email send error:', error);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Failed to send email');
      } else {
        console.log('Email sent:', info.response);
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Email sent successfully');
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`Gmail GET server running at http://localhost:${PORT}/send?to=...&subject=...&message=...`);
});
