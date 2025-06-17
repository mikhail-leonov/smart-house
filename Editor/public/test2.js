//
// Common part
//
function showSection(sectionId) {
	document.querySelectorAll('.section').forEach(section => {
		section.style.display = 'none';
	});
	document.getElementById(sectionId).style.display = 'block';
}

function isLeaf(nodeData) {
	return typeof nodeData === 'object' && Object.keys(nodeData).length === 0;
}

function findSensorIdByName(name) {
  return Object.keys(sensors).find(id => sensors[id].name === name);
}
//
// Drag part
//

document.addEventListener('dragstart', function (e) {
    if (e.target.dataset.sensorName) {
        e.dataTransfer.setData('drop-name', e.target.dataset.sensorName);
        console.log('Drag started, set drop-name:', e.target.dataset.sensorName);
    }
});

//
// Sensors part
//
let sensors = {};

function exportSensors(event) {
	const exportObj = {};
	sensors.forEach(sensor => {
		// Build base export sensor object
		const exportSensor = {};
		
		// If min_value and max_value present, export them and skip values array
		if (sensor.type === "binary") {
			exportSensor.values = [0, 1];
		}
		if (sensor.type === "list") {
			exportSensor.values = sensor.values || [];
		}
		if (sensor.type === "range") {
			exportSensor.min_value = sensor.min;
			exportSensor.max_value = sensor.max;
		}
		exportSensor.description = sensor.description;
		exportSensor.actions = sensor.actions || [];
		exportObj[sensor.name] = exportSensor;
	});
	const sensorEntries = Object.entries(exportObj).map(([key, val]) => {
		const valStr = JSON.stringify(val);
		return `"${key}": ${valStr}`;
	});
	const sensorsStr = sensorEntries.join(",\n  ");
	const jsonStr = `{\n  ${sensorsStr} \n }`;
	const blob = new Blob([jsonStr], { type: "application/json" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = "sensors.json";
	a.click();
	URL.revokeObjectURL(url);
}

function importSensors(event) {
	const file = event.target.files?.[0];
	if (!file) { return; }
	const reader = new FileReader();
	reader.onload = function (e) {
		try {
			const sensorsObj = JSON.parse(e.target.result);
			sensors = [];
			for (const [name, sensor] of Object.entries(sensorsObj)) {
				if (!sensor.description) { continue; }
				let values = Array.isArray(sensor.values) ? sensor.values : null;
				let type = "binary";
				let min = null;
				let max = null;
				if (values && Array.isArray(values) && values.length > 2) {
					type = "list";
				}
				if (sensor.min_value && sensor.max_value) {
					type = "range";
					min = sensor.min_value;
					max = sensor.max_value;
				}
				let actions = [];
				if (Array.isArray(sensor.actions)) {
					actions = sensor.actions;
				} else if (typeof sensor.actions === "string") {
					actions = sensor.actions.split(",").map(a => a.trim()).filter(Boolean);
				}
				const newSensor = { name, description: sensor.description, type, actions };
				if (type === "range") {
					newSensor.min = min;
					newSensor.max = max;
				}
				if (type === "list") {
					newSensor.values = values;
				}
				newSensor.type = type;
				sensors.push(newSensor);
			}
			renderSensors(sensors);
			event.target.value = null; 
		} catch (err) {
			alert("Error parsing JSON file: " + err.message);
		}
	};
	reader.readAsText(file);
}

function renderSensors(sensors) {
	const list = document.getElementById('sensors');
	list.innerHTML = '';

	for (const [id, meta] of Object.entries(sensors)) {
		const li = document.createElement('li');
		li.className = 'list-group-item';
		// Create link
		const link = document.createElement('a');
		link.href = '#';
		link.textContent = meta.name;
		link.dataset.sensorId = id;
		link.dataset.sensorName = meta.name;
		link.dataset.sensorDescription = meta.description;
		if (meta.min_value) {
			link.dataset.sensorMin = meta.min_value;
		}
		if (meta.max_value) {
			link.dataset.sensorMax = meta.max_value;
		}
		if (meta.values) {
			link.dataset.sensorValues = meta.values;
		}
		if (meta.actions) {
			link.dataset.sensorActions = meta.actions;
		}
		link.dataset.sensorType = meta.type;
		link.draggable = true; // if you want to keep drag functionality
		// Click handler to show modal
		link.addEventListener('click', (e) => {
			e.preventDefault();
			showSensorModal(link.dataset);
		});
		li.appendChild(link);
		list.appendChild(li);
	}
}

function updateModalFieldVisibility(type) {
	$('#rangeFields').toggle(type === 'range');
	$('#listValuesField').toggle(type === 'list');
}

function updateSensorFormVisibility(type) {
	const rangeFields = document.getElementById('rangeFields');
	const listField = document.getElementById('listValuesField');
	rangeFields.style.display = (type === 'range') ? 'block' : 'none';
	listField.style.display = (type === 'list') ? 'block' : 'none';
}


function showSensorModal(meta) {
	$('#sensorName').val(meta.sensorName || '');
	$('#sensorDescription').val(meta.sensorDescription || '');
	$('#sensorIsNew').val('false');
	document.getElementById('deleteSensorBtn').style.visibility = 'visible';
	
	$('#sensorType').val(meta.sensorType || '');
	updateSensorFormVisibility(meta.sensorType || '');
	$('#sensorMinValue').val(meta.sensorMin ?? '');
	$('#sensorMaxValue').val(meta.sensorMax ?? '');
	$('#sensorValues').val(meta.sensorValues ?? '');
	$('#sensorActions').val(meta.sensorActions ?? '');
	const modal = new bootstrap.Modal(document.getElementById('sensorEditModal'));
	modal.show();
}

document.getElementById('deleteSensorBtn').addEventListener('click', function (e) {
	const sensorId = $('#sensorIdEditing').val();
	if (sensorId) {
		const confirmed = confirm("Are you sure you want to delete this sensor?");
		if (confirmed) { 
			delete sensors[sensorId];
			renderSensors(sensors); // refresh the list
			// Close the modal
			bootstrap.Modal.getInstance(document.getElementById('sensorEditModal')).hide();
		}
	}
});

document.getElementById('saveSensorBtn').addEventListener('click', function (e) {
	const name = $('#sensorName').val().trim();
	const description = $('#sensorDescription').val().trim();
	const type = $('#sensorType').val();
	const min = $('#sensorMinValue').val();
	const max = $('#sensorMaxValue').val();
	const values = $('#sensorValues').val();
	const actions = $('#sensorActions').val();
	const isNew = $('#sensorIsNew').val() === 'true';

	if (!name) {
		alert("Sensor name is required.");
		return;
	}

	// Convert values and actions from strings
	const parsedValues = values.split(',').map(v => v.trim()).filter(v => v !== '');
	const parsedActions = actions.split(',').map(a => a.trim()).filter(a => a !== '');

	// Create a sensor object
	const sensor = {
		name,
		description,
		type,
		min: min ? Number(min) : undefined,
		max: max ? Number(max) : undefined,
		values: parsedValues,
		actions: parsedActions
	};

	// Either add or update
	let sensorId = Object.keys(sensors).find(id => sensors[id].name === name);

	if (isNew || !sensorId) {
		// Generate a unique ID
		sensorId = name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
	}

	sensors[sensorId] = sensor;

	// Optional: re-render sensor list
	renderSensors(sensors);

	// Close the modal
	bootstrap.Modal.getInstance(document.getElementById('sensorEditModal')).hide();
});


//
// Tree part
//
let tree = {};

function exportTree(event) {
	// Simple export JSON of the tree including home root
	const exportObj = { home: tree.home };
	const jsonStr = JSON.stringify(exportObj, null, 2);
	// Show in new tab
	const blob = new Blob([jsonStr], { type: "application/json" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = "tree.json";
	a.click();
	URL.revokeObjectURL(url);
}

function importTree(event) {
	const file = event.target.files[0];
	if (!file) {  return; }
	const reader = new FileReader();
	reader.onload = function(e) {
		try {
			const data = JSON.parse(e.target.result);
			if (!data.home) {
				alert('Invalid JSON format: missing "home" root.');
				return;
			}
			tree.home = data.home;
			renderTree(tree);
			event.target.value = null;
		} catch (err) {
			alert('Error parsing JSON: ' + err.message);
		}
	};
	reader.readAsText(file);
}

function renderTree(obj) {
    // Get the container where the tree should go
    const container = document.getElementById('tree');
    if (!container) {
        return;
    }
    // Clear container before rendering
    container.innerHTML = '';

    // Recursive helper to build the tree
    function buildTree(nodeObj) {
        const ul = document.createElement('ul');
        ul.className = 'list-group';

        for (const key in nodeObj) {
            const li = document.createElement('li');
            li.className = 'list-group-item';
            li.textContent = key;
            li.dataset.node = key;
			
            const nodeData = nodeObj[key];
            const leaf = isLeaf(nodeData);
			
			if (leaf) {
				li.addEventListener('dragover', e => {
					e.preventDefault();
					li.classList.add('border', 'border-primary', 'border-2');
				});
				li.addEventListener('dragleave', () => {
					li.classList.remove('border', 'border-primary', 'border-2');
				});
				li.addEventListener('drop', e => {
					e.preventDefault();
					li.classList.remove('border', 'border-primary', 'border-2');
					const sensorName = e.dataTransfer.getData('drop-name');
					if (!sensorName) { return; }
					// Check if sensor name is already present
					const alreadyExists = Array.from(li.querySelectorAll('div')).some(div => div.textContent === sensorName);
					if (alreadyExists) { return; }
					// Find sensor ID by name (optional, if you want description)
					const sensorId = findSensorIdByName(sensorName);
					const sensorDiv = document.createElement('div');
					sensorDiv.className = 'ms-3 small text-muted';
					sensorDiv.textContent = " - " + sensorName;
					sensorDiv.title = sensorId ? sensors[sensorId]?.description || '' : '';
					li.appendChild(sensorDiv);
				});
			}
            // Recurse to build children
            const childUl = buildTree(nodeData);
            if (childUl.children.length > 0) {
                li.appendChild(childUl);
            }
            ul.appendChild(li);
        }
        return ul;
    }

    // Build the tree and append it to container
    const tree = buildTree(obj);
    container.appendChild(tree);
}


