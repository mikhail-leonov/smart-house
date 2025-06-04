/**
 * SmartHub - AI powered Smart Home
 * MQTT JS Library for any HTML App 
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.6.8
 * @license MIT
 */

let mqttBrokerUrl = "ws://mqtt.jarvis.home:9001";

const mqttTopic = "home";
let mqttClient = null;

function buildMqttTopic(l, f, r, v) {
    let topic = l;
    if (f) {
        topic += `/${f}`;
    }
    topic += `/${r}/${v}`;
    return "home/" + topic;
}

function connectToMqtt() {
    if (mqttClient && mqttClient.connected) return mqttClient;
    if (!mqttBrokerUrl) { return null; }

    mqttClient = connect(mqttBrokerUrl);

    mqttClient.on('connect', () => {
        console.log("MQTT connected");
    });
    mqttClient.on('error', (err) => {
        console.log("MQTT connection error:", err.message);
    });
    mqttClient.on('close', () => {
        console.log("MQTT disconnected");
    });
    return mqttClient;
}

function disconnectFromMQTT() {
    if (mqttClient && mqttClient.connected) {
        mqttClient.end();
    }
}

function publishToMQTT(variable, topic, value, type, script) {
    if (mqttClient) {
        if (mqttClient.connected) {
		
			variable = variable.toLowerCase();
			topic = topic.toLowerCase();
			type = type.toLowerCase();
			if (!script) { script = "Undefined"; } 
			script = script.toLowerCase();
			
		    const payload = JSON.stringify({ 
				variable,
				value, 
				type, 
				timestamp: new Date().toISOString(),
				script
			})
			console.log(` - mqtt.publishToMQTT(${variable}, ${topic}, ${value}, ${type}, ${script})`);
            mqttClient.publish(topic, payload, { retain: true });
        } else {
            console.warn(`Cannot publish to MQTT ${mqttClient.connected}.`);
        }
    } else {
        console.warn(`Cannot publish to MQTT ${mqttClient}.`);
    }
}

const mqttContent = {
    mqttClient,
    mqttTopic,
    buildMqttTopic,
    connectToMqtt,
    disconnectFromMQTT,
    publishToMQTT
};

window.Jarvis = window.Jarvis || {};
window.Jarvis.mqtt = mqttContent;
connectToMqtt();
window.addEventListener('load', connectToMqtt);
window.addEventListener('beforeunload', disconnectFromMQTT);

