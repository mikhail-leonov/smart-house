/**
 * SmartHub - AI powered Smart Home
 * MQTT JS Library for any HTML App 
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov
 * @version 0.6.9
 * @license MIT
 */

(function () {
    const mqttUrl = "ws://mqtt.jarvis.home:9001";
    let client = null;

    // Core topic builder
    function buildMqttTopic(area, floor, room, variable) {
        console.log(`buildMqttTopic(${area}, ${floor}, ${room}, ${variable})`);
        return `home/${area}/${floor}/${room}/${variable}`;
    }

    // Payload builder
    function buildPayload(variable, value, type, script) {
        return {
            variable: variable.toLowerCase(),
            value: value,
            type: type?.toLowerCase() || "unknown",
            timestamp: new Date().toISOString(),
            script: script?.toLowerCase() || "undefined"
        };
    }

    function connectToMqtt() {
        if (client && client.connected) return client;

        console.log("Connecting to MQTT:", mqttUrl);
        client = mqtt.connect(mqttUrl);

        client.on("connect", () => {
            console.log("MQTT connected");
            mqttLib.onConnect?.();
        });

        client.on("reconnect", () => {
            console.log("MQTT reconnecting...");
            mqttLib.onReconnect?.();
        });

        client.on("error", (err) => {
            console.warn("MQTT connection error:", err.message);
            mqttLib.onError?.(err);
        });

        client.on("close", () => {
            console.warn("MQTT connection closed");
            mqttLib.onClose?.();
        });

        client.on("message", (topic, message) => {
            mqttLib.onMessage?.(topic, message.toString());
        });

        return client;
    }

    function disconnectFromMQTT() {
        if (client) {
            console.log("Disconnecting from MQTT...");
            client.end(true, () => {
                console.log("MQTT disconnected");
                mqttLib.onDisconnect?.();
            });
        }
    }

    function publishToMQTT(variable, topic, value, type, script) {
        if (client && client.connected) {
            const payload = JSON.stringify(buildPayload(variable, value, type, script));
            console.log(`Publishing to ${topic}: ${payload}`);
            client.publish(topic, payload, { retain: true });
            mqttLib.onPublish?.(variable, topic, value, type, script);
        } else {
            console.warn("Cannot publish — MQTT not connected.");
        }
    }

    function subscribeToTopic(topic) {
        if (client && client.connected) {
            client.subscribe(topic, (err, granted) => {
                if (err) {
                    console.warn(`Subscribe error [${topic}]:`, err.message);
                } else {
                    console.log(`Subscribed: ${topic}`);
                    mqttLib.onSubscribe?.(topic, granted);
                }
            });
        } else {
            console.warn(`Cannot subscribe — MQTT not connected.`);
        }
    }

    function unsubscribeFromTopic(topic) {
        if (client && client.connected) {
            client.unsubscribe(topic, (err) => {
                if (err) {
                    console.warn(`Unsubscribe error [${topic}]:`, err.message);
                } else {
                    console.log(`Unsubscribed: ${topic}`);
                    mqttLib.onUnsubscribe?.(topic);
                }
            });
        } else {
            console.warn(`Cannot unsubscribe — MQTT not connected.`);
        }
    }

    // Exposed library object
    const mqttLib = {
        get client() {
            return client;
        },
        buildMqttTopic,
        buildPayload,
        connectToMqtt,
        disconnectFromMQTT,
        publishToMQTT,
        subscribeToTopic,
        unsubscribeFromTopic,
        // Event hooks (optional)
        onConnect: null,
        onReconnect: null,
        onError: null,
        onClose: null,
        onDisconnect: null,
        onMessage: null,
        onPublish: null,
        onSubscribe: null,
        onUnsubscribe: null
    };

    // Export to global scope
    window.Jarvis = window.Jarvis || {};
    window.Jarvis.mqtt = mqttLib;

    // Auto connect/disconnect on load/unload
    window.addEventListener("load", connectToMqtt);
    window.addEventListener("beforeunload", disconnectFromMQTT);
})();
