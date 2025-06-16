/**
 * SmartHub - AI powered Smart Home
 * App which is running and read rules and try to validate them with AI and send command to a Controller 
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Ivan Leonov ivanleonov1002@gmail.com 
 * @version 0.7.2
 * @license MIT
 */

let sensors = [];
let editingIndex = null;

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

function createSensor() {
	const name = document.getElementById('sensorName').value.trim();
	const description = document.getElementById('sensorDesc').value.trim();
	const type = document.getElementById('sensorType').value;
	const actionsStr = document.getElementById('sensorActions').value.trim();
	if (!name || !description || !type) { return; }
	// Parse actions as array of trimmed strings
	const actions = actionsStr ? actionsStr.split(',').map(a => a.trim()).filter(Boolean) : [];
	const sensor = { name, description, type, actions };
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
	
	initializeList(sensors);
	
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
		// Actions column - comma separated string
		tr.innerHTML += `<td>${(sensor.actions || []).join(', ')}</td>`;
		tr.innerHTML += `<td style="vertical-align: top;">
			<button class="btn btn-sm btn-secondary me-2" title="Edit" onclick="startEditSensor(${index})">
				<i class="bi bi-gear-fill icon-white"></i>
			</button>
			<button class="btn btn-sm btn-danger" title="Delete" onclick="deleteSensor(${index})">
				<i class="bi bi-trash-fill icon-white"></i>
			</button>
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
	// Actions as comma separated string in input
	document.getElementById('sensorActions').value = (sensor.actions || []).join(', ');
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
	cancelEdit();
	sensors.splice(index, 1);
	renderSensors();
	cancelEdit();
}

function resetForm() {
	document.getElementById('sensorForm').reset();
	toggleRangeInputs();
	document.getElementById('sensorActions').value = '';
}

function exportSensors() {
	if (sensors.length === 0) {
		alert("No sensors to export.");
		return;
	}
	const exportObj = {};
	sensors.forEach(sensor => {
		// Build base export sensor object
		const exportSensor = {
			description: sensor.description,
			actions: sensor.actions || []
		};
		// If min_value and max_value present, export them and skip values array
		if (sensor.min !== undefined && sensor.max !== undefined) {
			exportSensor.min_value = sensor.min;
			exportSensor.max_value = sensor.max;
		} else {
			// Otherwise export values array normally
			let values = [];
			if (sensor.type === "binary") {
				values = [0, 1];
			} else if (sensor.type === "list") {
				values = sensor.values || [];
			} else if (sensor.type === "range") {
				values = [sensor.min, sensor.max];
			}
			exportSensor.values = values;
		}
		exportObj[sensor.name] = exportSensor;
	});
	const sensorEntries = Object.entries(exportObj).map(([key, val]) => {
		const valStr = JSON.stringify(val);
		return `"${key}": ${valStr}`;
	});
	const sensorsStr = sensorEntries.join(",\n  ");
	const jsonStr = `[\n {\n  ${sensorsStr} \n }\n]`;
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
	if (!file) { return; }
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
				if (!sensor.description) continue;
				// Determine values
				let values = sensor.values;
				if (!Array.isArray(values)) {
					if (typeof sensor.min_value === "number" && typeof sensor.max_value === "number") {
						values = [sensor.min_value, sensor.max_value];
					} else {
						console.warn(`Skipping sensor "${name}": missing values or min/max`);
						continue;
					}
				}
				// Guess sensor type
				let type = "binary";
				if (values.every(v => typeof v === "number")) {
					if (values.length === 2 && values.includes(0) && values.includes(1)) {
						type = "binary";
					} else {
						type = "range";
					}
				} else {
					type = "list";
				}
				let min, max;
				if (type === "range") {
					min = Math.min(...values);
					max = Math.max(...values);
				}
				// Normalize actions
				let actions = [];
				if (Array.isArray(sensor.actions)) {
					actions = sensor.actions;
				} else if (typeof sensor.actions === "string") {
					actions = sensor.actions.split(",").map(a => a.trim()).filter(Boolean);
				}
				const newSensor = {
					name,
					description: sensor.description,
					type,
					actions
				};
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

// Tree data, home is implicit root
let tree = { home: {} };

// Current edit state
let currentEdit = null;

// Helper to get nested object by path inside tree.home
function getAtPath(path) {
	let obj = tree.home;
	for (const key of path) {
		if (!obj[key]) obj[key] = {};
		obj = obj[key];
	}
	return obj;
}

// Render the full tree UI inside #treeContainer
function renderTree() {
	const container = document.getElementById('treeContainer');
	container.innerHTML = '';

	if (!tree.home || Object.keys(tree.home).length === 0) {
		container.textContent = "No areas defined.";
		return;
	}

	initializeTree(tree);

	const ulAreas = document.createElement('ul');
	ulAreas.className = 'nested-list';

	for (const areaName in tree.home) {
		const liArea = document.createElement('li');
		liArea.innerHTML = `<strong>Area: ${areaName}</strong> ` +
			`<button class="btn btn-sm btn-outline-primary ms-2" onclick="showEditForm('area', ['${areaName}'])">Edit</button> ` +
			`<button class="btn btn-sm btn-outline-danger" onclick="deleteNode('area', ['${areaName}'])">Delete</button> ` +
			`<button class="btn btn-sm btn-outline-success ms-2" onclick="showAddFloorForm(['${areaName}'])">Add Floor</button>`;

		const floors = tree.home[areaName];
		const ulFloors = document.createElement('ul');
		ulFloors.className = 'nested-list';

		for (const floorName in floors) {
			const liFloor = document.createElement('li');
			liFloor.innerHTML = `<strong>Floor: ${floorName}</strong> ` +
				`<button class="btn btn-sm btn-outline-primary ms-2" onclick="showEditForm('floor', ['${areaName}', '${floorName}'])">Edit</button> ` +
				`<button class="btn btn-sm btn-outline-danger" onclick="deleteNode('floor', ['${areaName}', '${floorName}'])">Delete</button> ` +
				`<button class="btn btn-sm btn-outline-success ms-2" onclick="showAddRoomForm(['${areaName}', '${floorName}'])">Add Room</button>`;
			const rooms = floors[floorName];
			const ulRooms = document.createElement('ul');
			ulRooms.className = 'nested-list';
			for (const roomName in rooms) {
				const liRoom = document.createElement('li');
				liRoom.innerHTML = `<strong>Room: ${roomName}</strong> ` +
					`<button class="btn btn-sm btn-outline-primary ms-2" onclick="showEditForm('room', ['${areaName}', '${floorName}', '${roomName}'])">Edit</button> ` +
					`<button class="btn btn-sm btn-outline-danger" onclick="deleteNode('room', ['${areaName}', '${floorName}', '${roomName}'])">Delete</button>`;
				ulRooms.appendChild(liRoom);
			}
			liFloor.appendChild(ulRooms);
			ulFloors.appendChild(liFloor);
		}
		liArea.appendChild(ulFloors);
		ulAreas.appendChild(liArea);
	}
	container.appendChild(ulAreas);
}

// Delete node (area/floor/room)
function deleteNode(level, path) {
	if (!confirm(`Delete this ${level} and all children?`)) return;

	if (level === 'area') {
		delete tree.home[path[0]];
	} else if (level === 'floor') {
		delete tree.home[path[0]][path[1]];
	} else if (level === 'room') {
		delete tree.home[path[0]][path[1]][path[2]];
	}
	renderTree();
}

// Show edit/add form for area/floor/room
function showEditForm(level, path) {
	currentEdit = { level, path };
	const formContainer = document.getElementById('formContainer');
	formContainer.innerHTML = '';

	const isEdit = true;
	let currentName = path[path.length - 1];

	const title = document.createElement('h5');
	title.textContent = (isEdit ? 'Edit ' : 'Add ') + capitalize(level);
	formContainer.appendChild(title);

	const nameGroup = document.createElement('div');
	nameGroup.className = 'mb-3';
	nameGroup.innerHTML = `<label class="form-label">Name</label>
		<input type="text" class="form-control" id="nodeNameInput" value="${currentName}" />`;
	formContainer.appendChild(nameGroup);

	const btnSave = document.createElement('button');
	btnSave.className = 'btn btn-primary me-2';
	btnSave.textContent = 'Save';
	btnSave.onclick = saveNode;

	const btnCancel = document.createElement('button');
	btnCancel.className = 'btn btn-secondary';
	btnCancel.textContent = 'Cancel';
	btnCancel.onclick = () => {
		currentEdit = null;
		formContainer.innerHTML = '';
	};

	formContainer.appendChild(btnSave);
	formContainer.appendChild(btnCancel);
}

function showAddAreaForm() {
	currentEdit = { level: 'area', path: [] };
	const formContainer = document.getElementById('formContainer');
	formContainer.innerHTML = `
		<h5>Add Area</h5>
		<div class="mb-3">
			<label class="form-label">Name</label>
			<input type="text" class="form-control" id="nodeNameInput" />
		</div>
		<button class="btn btn-primary me-2" onclick="saveNode()">Add</button>
		<button class="btn btn-secondary" onclick="cancelEdit()">Cancel</button>
	`;
}

function showAddFloorForm(path) {
	currentEdit = { level: 'floor', path };
	const formContainer = document.getElementById('formContainer');
	formContainer.innerHTML = `
		<h5>Add Floor</h5>
		<div class="mb-3">
			<label class="form-label">Name</label>
			<input type="text" class="form-control" id="nodeNameInput" />
		</div>
		<button class="btn btn-primary me-2" onclick="saveNode()">Add</button>
		<button class="btn btn-secondary" onclick="cancelEdit()">Cancel</button>
	`;
}

function showAddRoomForm(path) {
	currentEdit = { level: 'room', path };
	const formContainer = document.getElementById('formContainer');
	formContainer.innerHTML = `
		<h5>Add Room</h5>
		<div class="mb-3">
			<label class="form-label">Name</label>
			<input type="text" class="form-control" id="nodeNameInput" />
		</div>
		<button class="btn btn-primary me-2" onclick="saveNode()">Add</button>
		<button class="btn btn-secondary" onclick="cancelEdit()">Cancel</button>
	`;
}

function cancelEdit() {
	currentEdit = null;
	document.getElementById('formContainer').innerHTML = '';
}

function saveNode() {
	const nameInput = document.getElementById('nodeNameInput');
	if (!nameInput || !nameInput.value.trim()) {
		alert('Name cannot be empty');
		return;
	}
	const newName = nameInput.value.trim();
	if (!currentEdit) { return; }
	const { level, path } = currentEdit;
	let siblings;
	if (level === 'area') {
		siblings = tree.home;
	} else if (level === 'floor') {
		siblings = getAtPath(path.slice(0, 1));
	} else if (level === 'room') {
		siblings = getAtPath(path.slice(0, 2));
	}
	if (newName in siblings && (!path.length || newName !== path[path.length - 1])) {
		alert(`A ${level} with this name already exists.`);
		return;
	}
	if (path.length === 0) {
		// Adding new area
		tree.home[newName] = {};
	} else {
		// Editing existing node name
		if (level === 'area') {
			if (newName !== path[0]) {
				tree.home[newName] = tree.home[path[0]];
				delete tree.home[path[0]];
			}
		} else if (level === 'floor') {
			const areaObj = getAtPath(path.slice(0, 1));
			if (newName !== path[1]) {
				areaObj[newName] = areaObj[path[1]];
				delete areaObj[path[1]];
			}
		} else if (level === 'room') {
			const floorObj = getAtPath(path.slice(0, 2));
			if (newName !== path[2]) {
				floorObj[newName] = floorObj[path[2]];
				delete floorObj[path[2]];
			}
		}
	}
	currentEdit = null;
	document.getElementById('formContainer').innerHTML = '';
	renderTree();
}

function exportTree() {
	// Simple export JSON of the tree including home root
	const exportObj = { home: tree.home };
	const jsonStr = JSON.stringify(exportObj, null, 2);
	// Show in new tab
	const newTab = window.open();
	newTab.document.body.innerHTML = `<pre>${jsonStr}</pre>`;
}

function importTree(event) {
	const file = event.target.files[0];
	if (!file) return;
	const reader = new FileReader();
	reader.onload = function(e) {
		try {
			const data = JSON.parse(e.target.result);
			if (!data.home) {
				alert('Invalid JSON format: missing "home" root.');
				return;
			}
			tree.home = data.home;
			renderTree();
			cancelEdit();
			event.target.value = null;
		} catch (err) {
			alert('Error parsing JSON: ' + err.message);
		}
	};
	reader.readAsText(file);
}

// Utility function
function capitalize(s) {
	if (!s) return s;
	return s.charAt(0).toUpperCase() + s.slice(1);
}

// Initial render on script load
document.addEventListener('DOMContentLoaded', renderTree);

function convertToJsTreeData(obj) {
	const ignoreKeys = new Set(['description', 'values', 'min_value', 'max_value', 'actions']);
	const result = [];
	for (const [key, value] of Object.entries(obj)) {
		if (ignoreKeys.has(key)) continue; // Skip unwanted keys
		const node = { 
			text: key, 
			id: key + "-" + Math.random().toString(36).slice(2, 8)
		};
		// Only include children if the value is an object and has any non-ignored keys
		if (value && typeof value === 'object') {
			const childNodes = convertToJsTreeData(value);
			if (childNodes.length > 0) {
				node.children = childNodes;
			}
		}
		result.push(node);
	}
	return result;
}

function convertToJsListData(sensorArray, icon) {
	const result = [];
	for (const sensorObj of sensorArray) {
		for (const [key, value] of Object.entries(sensorObj)) {
			if (key == "name") { 
				const node = {
					text: value,
					id: key + "-" + Math.random().toString(36).slice(2, 8),
					icon: icon
				};
				result.push(node);
			}
		}
	}
	return result;
}



function initializeList(objList) {
	// Initialize external list as another tree (but no dnd allowed inside it)
	$('#mrgExternal').jstree({
		'core': {
			'data': convertToJsListData(objList, 'sensor.svg' ),
			'check_callback': false
		},
		'plugins': ['dnd']
	});
}

function initializeTree(objTree) {
	// Initialize main fs tree
	$('#mrgTree').jstree({
		'core': {
			'check_callback': function (operation, node, parent, position, more) {
				const tree = $('#mrgTree').jstree(true);
				// Block internal drag-and-drop
				if (operation === "move_node" && more && more.origin === tree) {
					return false;
				}
				// Allow drop only if target parent is a leaf node
				if (operation === "move_node" && parent) {
					const parentNode = tree.get_node(parent);
					// If parent has any children already (excluding the moving node), it's not a leaf
					const isLeaf = !parentNode.children || parentNode.children.length === 0;
					return isLeaf;
				}
				// Default: allow everything else
				return true;
			},
			'data': convertToJsTreeData(objTree, '')
		},
		'plugins': ['dnd']
	}).on('ready.jstree', function () {
		$('#mrgTree').jstree('open_all');  // Expand all nodes after loading
	});
}



// Flatten external list into a sensorMap: { sensorKey: metadata }
function createSensorMap(sensorArray) {
	const map = {};
	sensorArray.forEach(sensorObj => {
		for (const [key, value] of Object.entries(sensorObj)) {
			map[key] = value;
		}
	});
	return map;
}

// Rebuild nested config structure from jsTree node data, merging external metadata
function buildNestedObjectFromJsTree(nodes, sensorMap) {
	const result = {};
	nodes.forEach(node => {
		const key = node.text;
		if (node.children && node.children.length > 0) {
			result[key] = buildNestedObjectFromJsTree(node.children, sensorMap);
		} else {
			const meta = sensorMap[key];
			if (meta) {
				const { value, ...rest } = meta;
				result[key] = rest;
			} else {
				result[key] = {
					description: `No metadata for ${key}`
				};
			}
		}
	});
	return result;
}

// Helper to extract sensorArray from jsTree node text
function extractSensorArray(jsTreeNodes) {
	const result = [];
	jsTreeNodes.forEach(topNode => {
		const children = topNode.children || [];
		const obj = {};
		children.forEach(child => {
			const [k, v] = child.text.split(':').map(s => s.trim());
			if (!k) return;
			obj[k] = isNaN(v) ? v : Number(v);
		});
		const wrapper = {};
		wrapper[topNode.text] = obj;
		result.push(wrapper);
	});
	return result;
}

function exportConfig() {
	const tree = $('#mrgTree').jstree(true);
	const jsTreeData = tree.get_json('#', { flat: false });

	const sensorTree = $('#mrgExternal').jstree(true);
	const sensorRawData = sensorTree.get_json('#', { flat: false });
	const sensorArray = extractSensorArray(sensorRawData);
	const sensorMap = createSensorMap(sensorArray);

	const config = buildNestedObjectFromJsTree(jsTreeData, sensorMap);
	const fullConfig = config;  // <- no extra 'home' wrapping!

	const blob = new Blob([JSON.stringify(fullConfig, null, 2)], { type: 'application/json' });
	const a = document.createElement('a');
	a.href = URL.createObjectURL(blob);
	a.download = 'smart-home-config.json';
	document.body.appendChild(a);
	a.click();

	setTimeout(() => {
		URL.revokeObjectURL(a.href);
		document.body.removeChild(a);
	}, 100);
}