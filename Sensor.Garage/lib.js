/**
 * SmartHub - AI powered Smart Home
 * Library for App which reads values from local network IPv4
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.7.3
 * @license MIT
 */

// SmartHub - MyQ Garage Door Opener Access using the MyQ class
const MyQ = require('myq-api');
const environment = require('../Shared/env-node');

const env = environment.load();
const USERNAME = env.myq.mail;
const PASSWORD = env.myq.pass;

async function getMyQData(common) {
    console.log("   - getMyQData");

    const result = [];
    const myq = new MyQ();

    try {
        // Log in
        await myq.login(USERNAME, PASSWORD);
        console.log("   - MyQ login successful");

        // Get all devices
        const devices = await myq.getDevices();
        const doors = devices.filter(d => d.device_family === 'garagedoor');

        if (doors.length === 0) {
            console.warn("   - No garage doors found");
        }

        for (const door of doors) {
            const name = door.name || door.serial_number;
            const state = door.state?.door_state || "unknown";
            console.log(`   - ${name} state: ${state}`);
            result.push({ name, state });
        }

    } catch (err) {
        console.error("MyQ error:", err.message || err);
        result.push({ name: "Unknown", state: "Unknown" });
    }

    return result;
}

module.exports = {
    getMyQData
};
