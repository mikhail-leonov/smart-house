/**
 * SmartHub - AI powered Smart Home
 * Browser mqtt client
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.6.8
 * @license MIT
 */

const mqttPath = "#";
const mqttUrl = "ws://mqtt.jarvis.home:9001";

const client = mqtt.connect(mqttUrl);

let sHS = {};

function setStateValue(obj, path, value) {
    const keys = Array.isArray(path) ? path : path.split('/');
    let current = obj;
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const isLast = i === keys.length - 1;
        if (isLast) {
            current[key] = value;
        } else {
            if (!(key in current)) {
                current[key] = {};
            }
            current = current[key];
        }
    }
}

function assignVariable(topic, message) {
    const payload = message.toString();
    setStateValue(sHS, topic, payload);
}

client.on('connect', () => {
    client.subscribe(mqttPath);
});

client.on('message', (topic, message) => {
    
	assignVariable(topic, message);
	
    const payload = message.toString();
    const pathParts = topic.split('/');

    // Extract parts for locating the room and sensor:
    // Assuming topic format: "home/inside/first_floor/living-room-1f/temperature" or similar
    const [home, location, floor, room, sensor] = pathParts;

    // Find the matching room div by data attributes
    const roomDiv = document.querySelector(`.room[data-location="${location}"][data-floor="${floor}"][data-room="${room}"]`);

    if (roomDiv) {
        // Inside roomDiv find the sensor div by id
        const sensorDiv = roomDiv.querySelector(`#${sensor}`);
        if (sensorDiv) {
            const currentValuePayload = sensorDiv.getAttribute('data-value');
            let currentValue = null;
            if (currentValuePayload) {
                currentValue = JSON.parse(currentValuePayload).value;
            }
            let newValue = JSON.parse(payload).value;

            sensorDiv.setAttribute('data-value', payload);

            if (newValue !== currentValue) {
                roomDiv.classList.add('room-flash');
                setTimeout(() => {
                    roomDiv.classList.remove('room-flash');
                }, 1000);
            } else {
                //console.log( `For ${location}/${floor}/${room}/${sensor} we got the same value` );
            }
        } else {
            console.log( `${sensor} is not found` );
        }
    } else {
        console.log( `Room not found ${location}/${floor}/${room}` );
    }
});