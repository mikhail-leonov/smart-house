/**
 * SmartHub - AI powered Smart Home
 * Library for App which is reads values from sensors and send them to MQTT to update a home state
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.4.0
 * @license MIT
 */

const request = require('sync-request');
const lib = require('./common-lib.js'); 
const location = require('../Shared/location.js');
const constants = require('../Shared/constants.js');

function getSensorData(lon, lat) {
  console.log("getSensorData");
  let result = { sample: "11" };
  return result;
}

module.exports = {
    getSensorData
};
