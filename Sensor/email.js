/**
 * SmartHub - Gmail-to-MQTT Notification (Async MQTT)
 * Scans unread Gmail messages for subject and sends MQTT notice asynchronously
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov
 * @version 0.5.2
 * @license MIT
 */

const Imap = require('imap');
const { simpleParser } = require('mailparser');
const mqtt = require('../Shared/mqtt-node');

// CONFIGURATION
const GMAIL_USER = 'mikecommon@gmail.com';
const GMAIL_PASSWORD = 'srmr texe zkfu nhtn'; // Use App Password if 2FA is enabled
const SUBJECT_MATCH = 'NAS';

// Build the topic via helper
const topic = mqtt.buildMqttTopic('inside', 'house', 'email', 'nas');

// Setup IMAP for Gmail
const imap = new Imap({
  user: GMAIL_USER,
  password: GMAIL_PASSWORD,
  host: 'imap.gmail.com',
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false }
});

// Open inbox helper
function openInbox(cb) {
  imap.openBox('INBOX', false, cb);
}

// Scan for subject and publish MQTT notifications asynchronously
function scan() {
  console.log("Scan started");

  imap.once('ready', function () {
    openInbox(async function (err, box) {
      if (err) {
        console.error('[IMAP] Inbox error:', err);
        imap.end();
        return;
      }

      imap.search(['UNSEEN', ['HEADER', 'SUBJECT', SUBJECT_MATCH]], async function (err, results) {
        if (err) {
          console.error('[IMAP] Search error:', err);
          imap.end();
          return;
        }

        const varValue = results ? results.length : 0;

        // Send the count first
        const varName = 'emails';
        await mqtt.publishToMQTT(varName, topic, varValue, 'sensor');
        console.log(` - publishToMQTT(${varName}, ${topic}, ${varValue}, "web")`);

      });
    });
  });

  imap.once('error', function (err) {
    console.error('[IMAP] Error:', err);
  });

  imap.once('end', function () {
    console.log('[IMAP] Connection closed');
  });

  imap.connect();
  console.log("Scan done");
}

// Launch scan
scan();
