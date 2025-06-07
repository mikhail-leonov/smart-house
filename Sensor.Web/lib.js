/**
 * SmartHub - AI powered Smart Home
 * Library for App which is reads values from internet and send them to MQTT to update a home state
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.6.9
 * @license MIT
 */

const request = require('sync-request');
const path = require('path');
const location = require('../Shared/location');
const constants = require('../Shared/constants');
const cache = require('../Shared/cache-node');
const common = require('../Shared/common-node'); 

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

function getOceanData(common) {
  console.log("   - getOceanData");
  const baseUrl = 'https://marine-api.open-meteo.com/v1/marine';
  const params = [
    ['latitude', location.OCEAN_LAT],
    ['longitude', location.OCEAN_LON],
    ['timezone', constants.TIMEZONE],
    ['forecast_days', 1],
    ['hourly', [
      'wave_height', 'wave_direction', 'wave_period', 'wind_wave_height', 'wind_wave_direction', 'wind_wave_period', 'swell_wave_direction', 'swell_wave_height', 'swell_wave_period', 'sea_level_height_msl', 'sea_surface_temperature', 'ocean_current_velocity', 'ocean_current_direction'
    ].join(',')]
  ];
  const url = common.constructURL(baseUrl, params);
  const res = request('GET', url);
  const data = JSON.parse(res.getBody('utf8'));
  let result = parseData(data);
  return [result];
}

function getAirData(common) {
  console.log("   - getAirData");
  const baseUrl = 'https://air-quality-api.open-meteo.com/v1/air-quality';
  const params = [
    ['latitude', location.LAT],
    ['longitude', location.LON],
    ['timezone', constants.TIMEZONE],
    ['forecast_days', 1],
    ['hourly', [
      'pm10', 'pm2_5', 'carbon_monoxide', 'carbon_dioxide', 'nitrogen_dioxide', 'sulphur_dioxide', 'ozone', 'aerosol_optical_depth', 'dust', 'uv_index', 'ammonia', 'methane', 'alder_pollen', 'birch_pollen', 'grass_pollen', 'mugwort_pollen', 'olive_pollen', 'ragweed_pollen' 
    ].join(',')]
  ];

  const url = common.constructURL(baseUrl, params);
  const res = request('GET', url);
  const data = JSON.parse(res.getBody('utf8'));
  let result = parseData(data);
  return [result];
}

function getWeatherData(common) {
  console.log("   - getWeatherData");
  const baseUrl = 'https://api.open-meteo.com/v1/forecast';
  
  const params = [
    ['latitude', location.LAT],
    ['longitude', location.LON],
    ['timezone', constants.TIMEZONE],
    ['forecast_days', 1],
    ['hourly', [
      'temperature_2m', 'relative_humidity_2m', 'dew_point_2m', 'precipitation', 'precipitation_probability', 'weather_code',  'pressure_msl', 'cloud_cover', 'visibility', 'wind_speed_10m', 'wind_direction_10m', 'wind_gusts_10m', 'soil_temperature_0cm', 'soil_moisture_0_to_1cm' 
    ].join(',')],
  ];

  const url = common.constructURL(baseUrl, params);
  const res = request('GET', url);
  const data = JSON.parse(res.getBody('utf8'));
  let result = parseData(data);

  // Map to a human readable values
  result["weather_code"       ] = common.getWeatherDescription( result["weather_code"]);
  result["visibility"         ] = common.getVisibilityDescription( result["visibility"]);
  result["wind_direction_10m" ] = common.getWindDirection( result["wind_direction_10m"]);

  return [result];
}


module.exports = {
    getWeatherData, getAirData, getOceanData
};
