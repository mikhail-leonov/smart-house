/**
 * SmartHub - AI powered Smart Home
 * Browser mqtt client
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.6.9
 * @license MIT
 */

// Define your custom handler
mqttContent.onMessage = (topic, message) => {
    console.log(`[MQTT] Message received: ${topic} => ${message}`);

    // Try to parse the message as JSON
    let payload;
    try {
        payload = JSON.parse(message);
    } catch (e) {
        console.warn(`[MQTT] Invalid JSON in message on ${topic}:`, message);
        return;
    }

    // Split topic to extract smart home parts
    const parts = topic.split('/');
    const [, location, floor, room, sensor] = parts;

    // Find the correct room element
    const roomDiv = document.querySelector(`.room[data-location="${location}"][data-floor="${floor}"][data-room="${room}"]`);
    if (!roomDiv) {
        console.warn(`[UI] No room found for topic: ${topic}`);
        return;
    }

    const sensorDiv = roomDiv.querySelector(`#${sensor}`);
    if (!sensorDiv) {
        console.warn(`[UI] Sensor div not found: ${sensor}`);
        return;
    }

    // Compare new and old values
    const oldPayload = sensorDiv.getAttribute('data-value');
    const oldValue = oldPayload ? JSON.parse(oldPayload).value : null;
    const newValue = payload.value;

    sensorDiv.setAttribute('data-value', message);

    if (oldValue !== newValue) {
        roomDiv.classList.add('room-flash');
        setTimeout(() => roomDiv.classList.remove('room-flash'), 1000);
    }
};
