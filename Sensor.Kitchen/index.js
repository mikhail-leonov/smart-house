/**
 * SmartHub - Gmail-to-MQTT Notification (Stateless Quarterly Filter)
 * Fires MQTT "on" only on 1st day of Jan/Apr/Jul/Oct, "off" on the 2nd day. Stateless.
 * Fixed topic and variable name, no config dependency.
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.6.8
 * @license MIT
 */

const path = require('path');
const mqtt = require('../Shared/mqtt-node');

const FIXED_TOPIC = 'home/inside/first_floor/kitchen/filter_status';
const VAR_NAME = 'filter_status';

function getActionToday() {
    const now = new Date();
    const month = now.getMonth(); // 0-based: Jan = 0
    const day = now.getDate(); // 1-based

    // Quarter months hardcoded: Jan(0), Apr(3), Jul(6), Oct(9)
    const quarterMonths = [0, 3, 6, 9];

    if (quarterMonths.includes(month)) {
        if (day === 1) return "on";
        if (day === 2) return "off";
    }

    return null;
}

async function scan() {
    console.log("Scan started");
    const action = getActionToday();
    if (action) { 
		try {
			await mqtt.connectToMqtt();
			const script = path.basename(path.dirname(__filename));
			await mqtt.publishToMQTT(VAR_NAME, FIXED_TOPIC, action, "sensor", script);
			await mqtt.disconnectFromMQTT();
		} catch (err) {
			console.error("MQTT Error:", err.message);
		}
	} else {
	    console.log("Nothing to do");
	}
    console.log("Scan done");
}

(async () => {
    await scan();
})();
