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
const lib = require('./common-lib.js'); 
const location = require('../Shared/location');
const constants = require('../Shared/constants');
const cache = require('../Shared/cache-node');

function parseData(data) {
  const timeArray = data.hourly?.time;
  if (!Array.isArray(timeArray)) {
    throw new Error('Missing or invalid time array in response');
  }

  const now = new Date();
  const idx = timeArray.findIndex(t => new Date(t) > now);
  if (idx === -1) {
    throw new Error('No future data point found');
  }

  const result = {};
  for (const [key, values] of Object.entries(data.hourly)) {
    if (key === 'time') continue;
    const value = values?.[idx];
    result[key] = value !== null ? value : 0;
  }

  return result;
}

function getCurrencyData() {
  let result = {};
 
  const cacheKey = cache.getCachedKey('currencyData', 0, 0);
  if (cache.valueCached(cacheKey)) {
    console.log("getCurrencyData - cached");
    result = cache.getCachedValue(cacheKey);
  } else {
    console.log("getCurrencyData - live");

    // Cache miss or expired → fetch fresh data
    const base = 'USD';
    const symbols = ['EUR', 'GBP', 'JPY', 'CNY', 'RUB'];
    const baseUrl = 'https://api.exchangerate.host/live';

    const params = [
      ['access_key', 'e4ae239121c222408d563dd8cfc5b9cb'],
      ['currencies', symbols],
      ['source', base],
      ['format', 1]
    ];

    const url = lib.constructURL(baseUrl, params);
    const res = request('GET', url);
    const data = JSON.parse(res.getBody('utf8'));

    result = {};
    const prefix = base.toUpperCase();

    for (const [pair, rate] of Object.entries(data.quotes)) {
      const target = pair.replace(prefix, '');
      result[target] = rate;
    }

    cache.setCachedValue(result, cacheKey, 0, 0);
  }
  return result;
}


module.exports = {
    getCurrencyData
};
