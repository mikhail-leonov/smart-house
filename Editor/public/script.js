/**
 * SmartHub - AI powered Smart Home
 * App which is running and read rules and try to validate them with AI and send command to a Controller 
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Ivan Leonov ivanleonov1002@gmail.com 
 * @version 0.7.2
 * @license MIT
 */

function showSection(sectionId) {
  document.querySelectorAll('.section').forEach(section => {
	section.style.display = 'none';
  });
  document.getElementById(sectionId).style.display = 'block';
}

function toggleRangeInputs() {
  const type = document.getElementById('sensorType').value;
  document.getElementById('rangeInputs').style.display = type === 'range' ? 'block' : 'none';
  document.getElementById('listInputs').style.display = type === 'list' ? 'block' : 'none';
}

let sensors = [];
let editingIndex = null;

function createSensor() {
  const name = document.getElementById('sensorName').value.trim();
  const description = document.getElementById('sensorDesc').value.trim();
  const type = document.getElementById('sensorType').value;

  if (!name || !description || !type) return;

  const sensor = { name, description, type };

  if (type === 'range') {
	const min = document.getElementById('minValue').value;
	const max = document.getElementById('maxValue').value;
	if (min === '' || max === '') return;
	sensor.min = Number(min);
	sensor.max = Number(max);
  }
  if (type === 'binary') {
	sensor.min = 0;
	sensor.max = 1;
  }
  if (type === 'list') {
	const options = document.getElementById('listOptions').value.trim();
	if (!options) return;
	sensor.values = options.split(',').map(v => v.trim()).filter(Boolean);
  }

  if (editingIndex !== null) {
	sensors[editingIndex] = sensor;
	editingIndex = null;
	document.getElementById('addBtn').textContent = 'Add';
	document.getElementById('cancelEditBtn').style.display = 'none';
  } else {
	sensors.push(sensor);
  }

  resetForm();
  renderSensors();
}

function renderSensors() {
  const tbody = document.getElementById('sensorTableBody');
  tbody.innerHTML = '';
  sensors.forEach((sensor, index) => {
	const tr = document.createElement('tr');
	tr.innerHTML += `<td>${sensor.name}</td>`;
	tr.innerHTML += `<td>${sensor.description}</td>`;
	tr.innerHTML += `<td>${sensor.type}</td>`;

	let values = '';
	if (sensor.type === 'binary') values = '0, 1';
	else if (sensor.type === 'list') values = sensor.values.join(', ');
	tr.innerHTML += `<td>${values}</td>`;

	let minMax = '';
	if (sensor.type === 'range') minMax = `${sensor.min} - ${sensor.max}`;
	tr.innerHTML += `<td>${minMax}</td>`;

	tr.innerHTML += `<td>
	  <button class="btn btn-sm btn-secondary me-2" onclick="startEditSensor(${index})">Edit</button>
	  <button class="btn btn-sm btn-danger" onclick="deleteSensor(${index})">Remove</button>
	</td>`;
	tbody.appendChild(tr);
  });
}

function startEditSensor(index) {
  const sensor = sensors[index];
  document.getElementById('sensorName').value = sensor.name;
  document.getElementById('sensorDesc').value = sensor.description;
  document.getElementById('sensorType').value = sensor.type;
  toggleRangeInputs();

  if (sensor.type === 'range') {
	document.getElementById('minValue').value = sensor.min;
	document.getElementById('maxValue').value = sensor.max;
  } else {
	document.getElementById('minValue').value = '';
	document.getElementById('maxValue').value = '';
  }

  if (sensor.type === 'list') {
	document.getElementById('listOptions').value = sensor.values.join(', ');
  } else {
	document.getElementById('listOptions').value = '';
  }

  editingIndex = index;
  document.getElementById('addBtn').textContent = 'Save';
  document.getElementById('cancelEditBtn').style.display = 'inline-block';
}

function cancelEdit() {
  editingIndex = null;
  resetForm();
  document.getElementById('addBtn').textContent = 'Add';
  document.getElementById('cancelEditBtn').style.display = 'none';
}

function deleteSensor(index) {
  sensors.splice(index, 1);
  renderSensors();
  cancelEdit();
}

function resetForm() {
  document.getElementById('sensorForm').reset();
  toggleRangeInputs();
}

function exportSensors() {
	if (sensors.length === 0) {
		alert("No sensors to export.");
		return;
	}
	// Build the object
	const exportObj = {};
	sensors.forEach(sensor => {
		let values = [];
		if (sensor.type === "binary") {
			values = [0, 1];
		} else if (sensor.type === "list") {
			values = sensor.values;
		} else if (sensor.type === "range") {
			values = [sensor.min, sensor.max];
		}
		let defaultValue;
		if (sensor.type === "list") {
			defaultValue = values.length > 0 ? values[0] : null;
		} else if (sensor.type === "binary") {
			defaultValue = 0;
		} else if (sensor.type === "range") {
			defaultValue = sensor.min !== undefined ? sensor.min : 0;
		} else {
			defaultValue = null;
		}
		exportObj[sensor.name] = {
			value: defaultValue,
			values: values,
			description: sensor.description
		};
	});
	// Custom stringify each sensor's object on one line
	const sensorEntries = Object.entries(exportObj).map(([key, val]) => {
		// stringify val with no extra spaces
		const valStr = JSON.stringify(val);
		return `"${key}": ${valStr}`;
	});
	// Join sensors with comma + newline + 2 spaces indent for readability
	const sensorsStr = sensorEntries.join(",\n  ");

	// Wrap in array and object with indentation on array and outer object
	const jsonStr = `[\n  {\n  ${sensorsStr}\n  }\n]`;
	
	// Create Blob and trigger download as usual
	const blob = new Blob([jsonStr], { type: "application/json" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = "sensors.json";
	a.click();

	URL.revokeObjectURL(url);
}

function importSensors(event) {
	const file = event.target.files[0];
	if (!file) return;
	const reader = new FileReader();
	reader.onload = function(e) {
		try {
			const data = JSON.parse(e.target.result);
			if (!Array.isArray(data) || data.length === 0 || typeof data[0] !== 'object') {
				alert("Invalid sensors JSON format.");
				return;
			}
			const sensorsObj = data[0];
			sensors = [];
			for (const [name, sensor] of Object.entries(sensorsObj)) {
				if (!sensor.description || !Array.isArray(sensor.values)) {
					continue; // skip invalid
				}
				// Guess sensor type based on values
				let type = "binary";
				if (sensor.values.every(v => typeof v === "number")) {
					if (sensor.values.length === 2 && sensor.values.includes(0) && sensor.values.includes(1)) {
						type = "binary";
					} else {
						type = "range"; // rough guess for numeric range, but we only have values array here
					}
				} else {
					type = "list";
				}
				// For range, assign min/max from values if possible
				let min, max, values;
				if (type === "range") {
					min = Math.min(...sensor.values);
					max = Math.max(...sensor.values);
				} else if (type === "list") {
					values = sensor.values;
				}
				const newSensor = { name, description: sensor.description, type, };
				if (type === "range") {
					newSensor.min = min;
					newSensor.max = max;
				}
				if (type === "list") {
					newSensor.values = values;
				}
				sensors.push(newSensor);
			}
			renderSensors();
			event.target.value = null;
		} catch (err) {
			alert("Error parsing JSON file: " + err.message);
		}
	};

	reader.readAsText(file);
}
