(async () => {
  const mqtt = require('../Shared/mqtt-node'); // fix path if needed
  try {
    await mqtt.connectToMqtt();
    await mqtt.publishToMQTT('debug', mqtt.buildMqttTopic("test", "floor1", "roomX", "debug"), "Hello MQTT", "Test");
    await mqtt.disconnectFromMQTT();
  } catch (err) {
    console.error("Test failed:", err.message);
  }
})();
