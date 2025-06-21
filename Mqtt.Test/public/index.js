/**
 * SmartHub - AI powered Smart Home
 * test mqtt for node.js
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.7.3
 * @license MIT
 */

const mqttBrokerUrl = "ws://mqtt.jarvis.home:9001";
const client = mqtt.connect(mqttBrokerUrl);

client.on('connect', () => {
	console.log("Connected to MQTT broker");
});

client.on('error', (err) => {
	console.error("MQTT error:", err);
});

client.on('message', (topic, payload) => {
    const message = payload.toString();
    const logEntry = document.createElement('li');
    logEntry.className = "list-group-item";
    logEntry.textContent = `${new Date().toLocaleTimeString()} | ${topic}: ${message}`;
    document.getElementById('message-log').prepend(logEntry);
});

function handlePublishTopic() {
    const topic = document.getElementById('pub-topic').value.trim();
    const message = document.getElementById('pub-message').value.trim();
    if (topic && message) {
      client.publish(topic, message);
      console.log(`Published to ${topic}: ${message}`);
    }
}

document.getElementById('publish-btn').addEventListener('click', () => {
	handlePublishTopic();
});

function handleSubscribeTopic() {
    const topic = document.getElementById('sub-topic').value.trim();
    if (topic) {
		client.subscribe(topic, (err) => {
			if (err) {
				console.error(`Failed to subscribe to ${topic}`, err);
			} else {
				console.log(`Subscribed to ${topic}`);
			}
		});
    }
}

document.getElementById('subscribe-btn').addEventListener('click', () => {
	handleSubscribeTopic();
});
