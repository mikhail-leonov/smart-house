/**
 * SmartHub - AI powered Smart Home
 * Library for App which is reads values from sensors and send them to MQTT to update a home state
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.6.1
 * @license MIT
 */

const location = require('../Shared/location');
const config = require('../Shared/config-node');

function getWindDirection(degrees) {
  if (typeof degrees !== 'number' || degrees < 0 || degrees > 360) {
    return "Invalid wind direction";
  }
  const directions = [ "N", "NE", "E", "SE", "S", "SW", "W", "NW" ];
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

module.exports = {
    firstFutureIndex, constructURL, getWeatherDescription, getVisibilityDescription, getWindDirection
};
