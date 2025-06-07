/**
 * SmartHub - AI powered Smart Home
 * Common node.js lib
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.6.9
 * @license MIT
 */

const path = require('path');
const location = require('./location');
const config = require('./config-node');

async function callFunction(func, m) {
    if (typeof func !== 'function') {
        console.error("Provided argument is not a function.");
        return null;
    }
    try {
        const callResult = func(m);
        if (callResult instanceof Promise) {
            return await callResult;
        } else {
            return callResult;
        }
    } catch (err) {
        console.error("Error calling function:", err);
        return null;
    }
}

function getFlag(section, name) {
    return section && name in section ? section[name] : 0;
}

function getTopics(section) {
	let topics = [];
	if (typeof section["mqttTopics"] === 'string') {
		topics = section["mqttTopics"].split(',').map(t => t.trim()).filter(t => t.length > 0);
	} else if (Array.isArray(section["mqttTopics"])) {
		topics = section["mqttTopics"].map(t => t.trim()).filter(t => t.length > 0);
	}
	return topics;
}
	
async function processConfig(cfg, lib, mqtt, script) {
	const startTime = Date.now();
	
	const entry = cfg['entry'];
	for (const [key, value] of Object.entries(entry)) {
		if (String(value).trim() == "1" ) {
			if (typeof lib[key] === 'function') {
				let objs = callFunction(lib[key], module.exports);
				if (objs instanceof Promise) { objs = await objs; }
				for (const obj of objs) {
					if (typeof obj === 'object') {
						for (const [varName, varValue] of Object.entries(obj)) {
							const section = cfg[varName];
							// Check if variable is enabled = 1 in its parent section (e.g., getAirData)
							const parentSection = cfg[key];
							const flag = parentSection[varName];
							console.log(`     - ${varName} = ${flag}`);
							
							const isEnabled = parentSection && String(flag).trim() == '1';
							if (section && isEnabled) {
								const topics = getTopics(section);
								for (const topic of topics) {
									await mqtt.publishToMQTT(varName, topic, varValue, "web", script);
									pause(1);
								}
							}
						}
					}
				}
			}
		}
		console.log(`   - ${key} = ${value}`);
	}
	const duration = Date.now() - startTime;
	console.log(`   - executed in: ${duration} ms`);
}

function pause(seconds) {
    const start = Date.now(); while (Date.now() - start < 1000 * seconds) { }
}

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
	callFunction, processConfig, pause, firstFutureIndex, constructURL, getWeatherDescription, getVisibilityDescription, getWindDirection
};
