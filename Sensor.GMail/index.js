/**
 * SmartHub - Gmail-to-MQTT Notification (Async MQTT)
 * Scans unread Gmail messages for subject and sends MQTT notice asynchronously
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.6.8
 * @license MIT
 */

const Imap = require('imap');
const { simpleParser } = require('mailparser');
const mqtt = require('../Shared/mqtt-node');
const environment = require('../Shared/env-node');

const env = environment.load();

// CONFIGURATION
const GMAIL_USER = env.mail.name;
const GMAIL_PASSWORD = env.mail.checker;
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

    const script = path.basename(path.dirname(__filename));
    imap.once('ready', function () {
		openInbox(function (err, box) {
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
				const varName = 'emails';
				try {
					await mqtt.publishToMQTT(varName, topic, varValue, 'sensor', script);
				} catch (publishErr) {
					console.error('[MQTT] Publish error:', publishErr);
				} finally {
					imap.end(); // Close connection after publishing
				}
		    });
		});
	});

    imap.once('error', function (err) {
        console.error('[IMAP] Error:', err);
    });
	
    imap.once('end', function () {
        console.log('[IMAP] Connection closed');
        process.exit(0); // Exit process cleanly after done
    });
    imap.connect();
}

// Launch scan once
scan();
