const request = require('sync-request');

let LAT = +26.2700;
let LON = -80.2700;

let OCEAN_LAT =  26.291471;
let OCEAN_LON = -80.073096;

function getWindDirection(degrees) {
  if (typeof degrees !== 'number' || degrees < 0 || degrees > 360) {
    return "Invalid wind direction";
  }

  const directions = [
    "N", "NE", "E", "SE",
    "S", "SW", "W", "NW"
  ];

  // Each direction covers 45 degrees (360/8)
  const index = Math.floor((degrees + 22.5) / 45) % 8;
  return directions[index];
}

function getVisibilityDescription(meters) {
  if (typeof meters !== 'number' || meters < 0) return "Invalid visibility";

  if (meters >= 10000) {
    return "Excellent visibility";
  } else if (meters >= 4000) {
    return "Good visibility";
  } else if (meters >= 1000) {
    return "Moderate visibility";
  } else if (meters >= 500) {
    return "Poor visibility";
  } else if (meters > 0) {
    return "Very poor visibility";
  } else {
    return "No visibility";
  }
}

function getWeatherDescription(code) {
  const weatherDescriptions = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm (slight/moderate)",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail"
  };

  return weatherDescriptions[code] || "Unknown weather code";
}

function constructURL(baseUrl, params) {
  const queryString = params
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}=${value.join(',')}`; // keep comma
      } else {
        return `${key}=${value}`;
      }
    })
    .join('&');
  return `${baseUrl}?${queryString}`;
}

function firstFutureIndex(times) {
  const now = new Date();
  for (let i = 0; i < times.length; i++) {
    const t = new Date(times[i]);
    if (t >= now) return i;
  }
  return -1;
}

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

function getOceanData(lon, lat) {
  console.log("getOceanData");
  const baseUrl = 'https://marine-api.open-meteo.com/v1/marine';
  const params = [
    ['latitude', OCEAN_LAT],
    ['longitude', OCEAN_LON],
    ['timezone', 'GMT-5'],
    ['forecast_days', 1],
    ['hourly', [
      'wave_height', 'wave_direction', 'wave_period', 'wind_wave_height', 'wind_wave_direction', 'wind_wave_period', 'swell_wave_direction', 'swell_wave_height', 'swell_wave_period', 'sea_level_height_msl', 'sea_surface_temperature', 'ocean_current_velocity', 'ocean_current_direction'
    ].join(',')]
  ];
  const url = constructURL(baseUrl, params);
  const res = request('GET', url);
  const data = JSON.parse(res.getBody('utf8'));
  let result = parseData(data);
  return result;
}

function getAirData() {
  console.log("getAirData");
  const baseUrl = 'https://air-quality-api.open-meteo.com/v1/air-quality';
  const params = [
    ['latitude', LAT],
    ['longitude', LON],
    ['timezone', 'GMT-5'],
    ['forecast_days', 1],
    ['hourly', [
      'pm10', 'pm2_5', 'carbon_monoxide', 'carbon_dioxide', 'nitrogen_dioxide', 'sulphur_dioxide', 'ozone', 'aerosol_optical_depth', 'dust', 'uv_index', 'ammonia', 'methane', 'alder_pollen', 'birch_pollen', 'grass_pollen', 'mugwort_pollen', 'olive_pollen', 'ragweed_pollen' 
    ].join(',')]
  ];

  const url = constructURL(baseUrl, params);
  const res = request('GET', url);
  const data = JSON.parse(res.getBody('utf8'));
  let result = parseData(data);
  return result;
}

function getWeatherData(lon, lat) {
  console.log("getWeatherData");
  const baseUrl = 'https://api.open-meteo.com/v1/forecast';
  
  const params = [
    ['latitude', LAT],
    ['longitude', LON],
    ['timezone', 'GMT-5'],
    ['forecast_days', 1],
    ['hourly', [
      'temperature_2m', 'relative_humidity_2m', 'dew_point_2m', 'precipitation', 'precipitation_probability', 'weather_code',  'pressure_msl', 'cloud_cover', 'visibility', 'wind_speed_10m', 'wind_direction_10m', 'wind_gusts_10m', 'soil_temperature_0cm', 'soil_moisture_0_to_1cm' 
    ].join(',')],
  ];

  const url = constructURL(baseUrl, params);
  const res = request('GET', url);
  const data = JSON.parse(res.getBody('utf8'));
  let result = parseData(data);

  // Map to a human readable values
  result["weather_code"       ] = getWeatherDescription( result["weather_code"]);
  result["visibility"         ] = getVisibilityDescription( result["visibility"]);
  result["wind_direction_10m" ] = getWindDirection( result["wind_direction_10m"]);

  return result;
}

module.exports = {
    getWeatherData,
    getAirData,
    getOceanData
};
