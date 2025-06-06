/**
 * SmartHub - AI powered Smart Home
 * Library for App which is reads values from internet and send them to MQTT to update a home state
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.6.8
 * @license MIT
 */

const request = require('sync-request');
const path = require('path');
const location = require('../Shared/location');
const constants = require('../Shared/constants');
const cache = require('../Shared/cache-node');

const { Client } = require('tplink-smarthome-api');

function getKasaData() {
  console.log("getKasaData");

const client = new Client();
  const result = {};

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      client.stopDiscovery();
      resolve(result);
    }, 3000); // 10-second discovery window

    client.startDiscovery().on('device-new', async (device) => {
      try {
        await device.getSysInfo(); // Wake it up

        const name = device.alias || device.deviceId || `Device_${Date.now()}`;
        let status = {};

        if (device.deviceType === 'plug') {
          status = {
            power: await device.getPowerState()
          };
        } else if (device.deviceType === 'bulb') {
          const lightState = await device.lighting.getLightState();
          status = {
            power: lightState.on,
            brightness: lightState.brightness,
            color_temp: lightState.color_temp,
          };
        } else {
          status = { message: 'Unsupported device type' };
        }

        result[name] = {
          id: device.deviceId,
          type: device.deviceType,
          host: device.host,
          alias: name,
          status
        };

        console.log(`? Found device: ${name}`);
      } catch (err) {
        console.error(`? Error with device: ${err.message}`);
      }
    });

    client.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
  
}


module.exports = {
    getKasaData
};
