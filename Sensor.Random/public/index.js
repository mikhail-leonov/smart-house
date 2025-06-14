/**
 * SmartHub - AI powered Smart Home
 * Browser JS for random events generator App
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.7.1
 * @license MIT
 */

let configData = null;
let flatVariableMap = {};

document.getElementById('configFile').addEventListener('change', handleConfigFileUpload);
document.getElementById('startRandomBtn').addEventListener('click', handleStartClick);
document.getElementById('stopRandomBtn').addEventListener('click', handleStopClick);
document.getElementById('sendSingleRandomBtn').addEventListener('click', handleSendClick);



function filterValues(obj, index, filterValue) {
  return Object.fromEntries(
    Object.entries(obj).filter(([key, value]) => {
      const parts = key.split('/');
      return parts.length > index && parts[index] === filterValue;
    })
  );
}

function handleStartClick(event) {
    let filteredMap = JSON.parse(JSON.stringify(flatVariableMap)); 

    const selectedArea = document.getElementById('areas').value;
    const selectedFloor = document.getElementById('floors').value;
    const selectedRoom = document.getElementById('rooms').value;
    const selectedVariable = document.getElementById('variables').value;

	let appliedFilters = [];

	if (selectedArea)     { filteredMap = filterValues(filteredMap, 1, selectedArea);     appliedFilters.push(`Area: ${selectedArea}`); }
	if (selectedFloor)    { filteredMap = filterValues(filteredMap, 2, selectedFloor);    appliedFilters.push(`Floor: ${selectedFloor}`); }
	if (selectedRoom)     { filteredMap = filterValues(filteredMap, 3, selectedRoom);     appliedFilters.push(`Room: ${selectedRoom}`); }
	if (selectedVariable) { filteredMap = filterValues(filteredMap, 4, selectedVariable); appliedFilters.push(`Variable: ${selectedVariable}`); }

	logMessageToConsole("Random value sending started");
	if (appliedFilters.length > 0) {
		logMessageToConsole("Filters: " + appliedFilters.join(", "));
	} else {
		logMessageToConsole("Filters: none (using full dataset)");
	}
	
    if (Object.keys(filteredMap).length > 0) {
		startRandomSelection(filteredMap);
    } else {
        logMessageToConsole("No matching variables found.");
    }
}


let randomInterval = null;

function startRandomSelection(filteredMap) {

	document.getElementById('startRandomBtn').disabled = true;
	
    if (randomInterval) {
        clearInterval(randomInterval); // Clear if already running
    }
    const keys = Object.keys(filteredMap);

	let interval = document.getElementById('interval').value || 1;

    randomInterval = setInterval(() => {
        const randomIndex = Math.floor(Math.random() * keys.length);
        const randomTopic = keys[randomIndex];
        const randomValue = filteredMap[randomTopic];
		
		const randomTopicValue = getVariableValue(randomValue);
		
		// Generate variable from this settings and send as mqtt message
		const variableName = randomTopic.split("/").pop();
		logMessageToConsole(randomTopic + " = " +  randomTopicValue);
		window.Jarvis.mqtt.publishToMQTT(variableName, randomTopic, randomTopicValue, "Random", "Sensor.Random");
		
    }, interval * 1000); 
	
	document.getElementById('stopRandomBtn').disabled = false;
}

function getVariableValue(variable) {
    if (!variable) { return null; }
    // If a fixed value exists
    if ('value' in variable) return variable.value;
    // If a list of possible values is provided
    if (Array.isArray(variable.values)) {
        const idx = Math.floor(Math.random() * variable.values.length);
        return variable.values[idx];
    }
    // If it's a range with min and max
    if ('min_value' in variable && 'max_value' in variable) {
        const min = parseFloat(variable.min_value);
        const max = parseFloat(variable.max_value);
        if (!isNaN(min) && !isNaN(max)) {
            return +(Math.random() * (max - min) + min).toFixed(2); // Two decimal precision
        }
    }
    return null; // Unknown or unsupported format
}

function handleStopClick(event) {
    if (randomInterval) {
        clearInterval(randomInterval);
        randomInterval = null;
        logMessageToConsole("Random selection stopped.");
		document.getElementById('stopRandomBtn').disabled = true;
		document.getElementById('startRandomBtn').disabled = false;
    }
}

function handleSendClick(event) {

    let filteredMap = JSON.parse(JSON.stringify(flatVariableMap)); 

    const selectedArea = document.getElementById('areas').value;
    const selectedFloor = document.getElementById('floors').value;
    const selectedRoom = document.getElementById('rooms').value;
    const selectedVariable = document.getElementById('variables').value;

    if (selectedArea)     { filteredMap = filterValues(filteredMap, 1, selectedArea);     }
    if (selectedFloor)    { filteredMap = filterValues(filteredMap, 2, selectedFloor);    }
    if (selectedRoom)     { filteredMap = filterValues(filteredMap, 3, selectedRoom);     }
    if (selectedVariable) { filteredMap = filterValues(filteredMap, 4, selectedVariable); }

    const keys = Object.keys(filteredMap);
    const randomIndex = Math.floor(Math.random() * keys.length);
    const randomTopic = keys[randomIndex];
    const randomValue = filteredMap[randomTopic];
	const randomTopicValue = getVariableValue(randomValue);
	// Generate variable from this settings and send as mqtt message
	const variableName = randomTopic.split("/").pop();
	logMessageToConsole(randomTopic + " = " +  randomTopicValue);
	window.Jarvis.mqtt.publishToMQTT(variableName, randomTopic, randomTopicValue, "Random", "Sensor.Random");
}

function handleConfigFileUpload(event) {
    const file = event.target.files[0];
    if (!file) {
        logMessageToConsole('No file selected', 'error');
        return;
    }
    if (!file.name.endsWith('.json')) {
        logMessageToConsole('Please upload a JSON file', 'error');
        return;
    }
    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const jsonContent = e.target.result;
            if (!jsonContent.trim()) throw new Error('File is empty');
            configData = JSON.parse(jsonContent);
            if (!configData || !configData.home) {
                throw new Error('Invalid config structure: missing "home" property');
            }
            logMessageToConsole('Configuration loaded successfully');
            flatVariableMap = flattenConfig(configData.home);
            logMessageToConsole(`Parsed ${Object.keys(flatVariableMap).length} variables`);

            populateDropdown("areas",     getUniqueKeys(flatVariableMap, 1));
            populateDropdown("floors",    getUniqueKeys(flatVariableMap, 2));
            populateDropdown("rooms",     getUniqueKeys(flatVariableMap, 3));
            populateDropdown("variables", getUniqueKeys(flatVariableMap, 4));

            console.log("Flattened variable map:", flatVariableMap);
        } catch (error) {
            logMessageToConsole('Error parsing JSON: ' + error.message, 'error');
            console.error('Detailed error:', error);
            configData = null;
        }
    };
    reader.onerror = function () {
        logMessageToConsole('Error reading file', 'error');
    };
    reader.readAsText(file);
}

function flattenConfig(node, path = 'home') {
    const result = {}; // Fixed: should be an object, not array
    for (const key in node) {
        const value = node[key];
        const newPath = `${path}/${key}`;
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            const isLeaf = (
                'value' in value || 
                'max_value' in value || 
                'min_value' in value || 
                'values' in value || 
                'description' in value
            );
            if (isLeaf) {
                result[newPath] = value;
            } else {
                Object.assign(result, flattenConfig(value, newPath));
            }
        }
    }
    return result;
}

function getUniqueKeys(flatMap, index) {
    const uniqueSet = new Set();
    for (const key in flatMap) {
        const parts = key.split('/');
        if (parts.length >= index + 1 && parts[0] === 'home') {
            uniqueSet.add(parts[index]);
        }
    }
    return Array.from(uniqueSet).sort();
}

function populateDropdown(dropdownId, values) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) return;

    dropdown.innerHTML = '';

    const defaultOption = document.createElement('option');
    defaultOption.text = 'Select...';
    defaultOption.value = "";
    defaultOption.disabled = false;
    defaultOption.selected = true;
    dropdown.appendChild(defaultOption);
    dropdown.disabled = false;

    values.forEach(value => {
        const option = document.createElement('option');
        option.value = value;
        option.text = value;
        dropdown.appendChild(option);
    });
}

function logMessageToConsole(msg, type = 'info') {
    const logDiv = document.getElementById('log');
    const div = document.createElement('div');
    div.className = type === 'error' ? 'text-danger' : 'text-secondary';
    div.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    if (logDiv) logDiv.appendChild(div);
    if (logDiv) logDiv.scrollTop = logDiv.scrollHeight;
}
