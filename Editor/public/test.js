/**
 * SmartHub - AI powered Smart Home
 * App which is running and read rules and try to validate them with AI and send command to a Controller 
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Ivan Leonov ivanleonov1002@gmail.com 
 * @version 0.7.2
 * @license MIT
 */

//
// Common part
//
function showSection(sectionId) {
	document.querySelectorAll('.section').forEach(section => {
		section.style.display = 'none';
	});
	document.getElementById(sectionId).style.display = 'block';
}



//
// Sensor part
//
let sensors = [];

//
// Sensor events 
//
document.getElementById('sensorEditForm').addEventListener('submit', function (e) {
	handleListModalSUbmit(e);
});
document.getElementById('deleteSensorBtn').addEventListener('click', function (e) {
    handledeleteSensor(e);
});
$('#sensorType').on('change', function () {
	updateModalFieldVisibility(this.value);
});

//
// Sensor functions
//
function convertToJsListData(sensorObjMap, icon) {
	const result = [];
	for (const [key, sensorData] of Object.entries(sensorObjMap)) {
		const node = {
			text: sensorData.name,
			id: 'sensor' + "-" + sensorData.name + "-" + key,
			icon: icon,
			data: sensorData,
			sensor: true
		};
		result.push(node);
	}
	return result;
}

function initializeList(sensorObjMap) {
	// Destroy existing jsTree instance if it exists
	const existingTree = $('#list').jstree(true);
	if (existingTree) {
		$('#list').jstree('destroy').empty();
	}
	// Create new tree
	$('#list').jstree({
		'core': {
			'data': convertToJsListData(sensorObjMap, 'gear.png'),
			'check_callback': false
		},
		plugins: ["dnd", "types"] 
	});
	$('#list').on('select_node.jstree', function (e, data) {
		handleListClick(e, data);
	});
}

function importSensors(event) {
	const file = event.target.files?.[0];
	if (!file) return;
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
				
				// Detect type
				if (values && Array.isArray(values) && values.length > 2) {
					type = "list";
				}
				// Fallback to min/max if defined and not set above
				if (sensor.min_value && sensor.max_value) {
					type = "range";
					min = sensor.min_value;
					max = sensor.max_value;
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
			initializeList(sensors);
			event.target.value = null; // Reset file input
		} catch (err) {
			alert("Error parsing JSON file: " + err.message);
		}
	};
	reader.readAsText(file);
}


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



function handleListClick(e, data) {
	const sensor = data.node.data || {};
	$('#sensorName').val(data.node.text);
	$('#sensorDescription').val(sensor.description || '');
	$('#sensorIsNew').val('false');

	document.getElementById('deleteSensorBtn').visible = true;

	$('#sensorType').val(sensor.type);
	updateSensorFormVisibility(sensor.type);

	// Set field values
	$('#sensorMinValue').val(sensor.min ?? '');
	$('#sensorMaxValue').val(sensor.max ?? '');
	$('#sensorValues').val(sensor.values ? sensor.values.join(', ') : '');
	$('#sensorActions').val(Array.isArray(sensor.actions) ? sensor.actions.join(', ') : (sensor.actions || ''));

	// Show modal
	const modal = new bootstrap.Modal(document.getElementById('sensorEditModal'));
	modal.show();
}


function handleListModalSUbmit(e) {
	e.preventDefault(); // Prevent the default form submit (page reload)

	const name = document.getElementById('sensorName').value.trim();
	const type = document.getElementById('sensorType').value;
	const description = document.getElementById('sensorDescription').value.trim();
	const actions = document.getElementById('sensorActions').value
		.split(',')
		.map(a => a.trim())
		.filter(Boolean);

	let updatedSensor = {
		name,
		type,
		description,
		actions
	};

	if (type === 'range') {
		updatedSensor.min = parseFloat(document.getElementById('sensorMinValue').value);
		updatedSensor.max = parseFloat(document.getElementById('sensorMaxValue').value);
	} else if (type === 'list') {
		updatedSensor.values = document.getElementById('sensorValues').value
			.split(',')
			.map(v => v.trim())
			.filter(v => v.length > 0);
	}

	const isNew = $('#sensorIsNew').val() === "true";
	const tree = $('#list').jstree(true);

	if (isNew) {
		// Add new sensor to array
		sensors.push(updatedSensor);

		// Add to jsTree
		tree.create_node('#', {
			id: name,
			text: name,
			icon: 'gear.png',
			data: { ...updatedSensor },
			sensor: true
		}, 'last');

		// Reset the new marker
		$('#sensorIsNew').val('false');
	} else {
		// Update existing in array
		const index = sensors.findIndex(s => s.name === name);
		if (index !== -1) {
			sensors[index] = updatedSensor;
		}

		// Update jsTree node data
		const selectedNode = tree.get_selected(true)[0];
		if (selectedNode) {
			selectedNode.data = { ...updatedSensor };
			tree.rename_node(selectedNode, name);
		}
	}

	initializeList(sensors); // re-render to sync everything

	// Close modal
	const modalElement = document.getElementById('sensorEditModal');
	const modal = bootstrap.Modal.getInstance(modalElement);
	if (document.activeElement && modalElement.contains(document.activeElement)) {
		document.activeElement.blur();
	}
	modal.hide();	
}

function updateModalFieldVisibility(type) {
	$('#rangeFields').toggle(type === 'range');
	$('#listValuesField').toggle(type === 'list');
}


function handledeleteSensor(e) {
	const name = document.getElementById('sensorName').value;
	if (!name) { return; }
	if (confirm(`Are you sure you want to delete sensor "${name}"?`)) {
		const index = sensors.findIndex(s => s.name === name);
		if (index !== -1) {
			sensors.splice(index, 1);
			initializeList(sensors);
		}
		// Hide the modal safely
		const modalElement = document.getElementById('sensorEditModal');
		const modal = bootstrap.Modal.getInstance(modalElement);
		if (document.activeElement && modalElement.contains(document.activeElement)) {
			document.activeElement.blur();
		}
		modal.hide();	}
}

function createNewSensor() {
	// Clear modal fields
	document.getElementById('sensorName').value = '';
	document.getElementById('sensorType').value = 'binary';
	document.getElementById('sensorDescription').value = '';
	document.getElementById('sensorMinValue').value = '';
	document.getElementById('sensorMaxValue').value = '';
	document.getElementById('sensorValues').value = '';
	document.getElementById('sensorActions').value = '';
	document.getElementById('deleteSensorBtn').visible = false;
	$('#sensorIsNew').val('true');
	
	// Show/hide input sections depending on type
	updateSensorFormVisibility('binary');

	// Mark that this is a new sensor
	document.getElementById('sensorName').readOnly = false;
	document.getElementById('sensorEditForm').dataset.isNew = 'true';

	// Show the modal
	const modal = new bootstrap.Modal(document.getElementById('sensorEditModal'));
	modal.show();
}

function updateSensorFormVisibility(type) {
	const rangeFields = document.getElementById('rangeFields');
	const listField = document.getElementById('listValuesField');

	rangeFields.style.display = (type === 'range') ? 'block' : 'none';
	listField.style.display = (type === 'list') ? 'block' : 'none';
}





//
// Sensor initaializations
//
initializeList(sensors);



//
// Tree part
//
let tree = { home: {} };

//
// Tree events 
//



//
// Tree functions
//
function initializeTree(objTree) {
	// Destroy existing jsTree instance if it exists
	const existingTree = $('#tree').jstree(true);
	if (existingTree) {
		$('#tree').jstree('destroy').empty();
	}
	$('#tree').jstree({
		core: {
			check_callback: function (operation, node, parent, position, more) {
				const tree = $('#tree').jstree(true);
				// Prevent internal drag-drop within #tree
				if (operation === "move_node" && more?.origin === tree) {
					return false;
				}
				// Allow drop from #list only into leaf nodes
				if (operation === "move_node" && parent && more?.origin) {
					const parentNode = tree.get_node(parent);
					const isLeaf = parentNode.original?.originalLeaf === true;
					const isFromList = more.origin.element?.attr('id') === 'list';
					
					const fromList = more && more.origin && more.origin.element.attr('id') === 'list';
					const toTree = this.element && this.element.attr('id') === 'tree';
					if (fromList && toTree && parent) {
						// Ensure it's a sensor leaf
						node.sensor = true;
						node.children = [];
						
						// Optional: copy metadata from original
						const origNode = more?.origin?.get_node?.(more?.origin?.get_node(node.id));
						if (origNode?.data) {
							node.data = { ...origNode.data };
						}
						
						if (node.data.description) {
							node.description = node.data.description;
						}
						if (node.data.actions) {
							node.actions = node.data.actions;
						}
						if (node.data.min_value) {
							node.min_value = node.data.min_value;
						}
						if (node.data.max_value) {
							node.max_value = node.data.max_value;
						}
						if (node.data.values) {
							node.values = node.data.values;
						}
						console.log(node);
						// Optional: clean up other UI-related data
						delete node.state; // Just in case it carries open/closed state
						delete node.li_attr; // Remove inherited HTML attributes if any
					}
					return isFromList && isLeaf;
				}
				return true;
			},
			data: convertToJsTreeData(objTree)
		},
		plugins: ["contextmenu", "dnd", "types"], 
		contextmenu: {
			items: function (node) {
				return {
					delete: {
						label: "Delete Sensor",
						// icon: "jstree-icon jstree-close", // icon removed from here as requested
						action: function () {
							const tree = $('#tree').jstree(true);
							if (node.icon === "gear.png") {
								if (confirm(`Delete "${node.text}"?`)) {
									tree.delete_node(node);
								}
							}
						}
					}
				}
			}
		}
	});
	
	$('#tree').on('ready.jstree', function () {
		$('#tree').jstree('open_all');
	});	
	$('#tree').on('select_node.jstree', function (e, data) {
		handleTreeClick(e, data);
	});
	
}
function handleTreeClick(e, data) {
	const sensor = data.node.data || {};
	console.log(sensor);
}
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
			initializeTree(tree);
			event.target.value = null;
		} catch (err) {
			alert('Error parsing JSON: ' + err.message);
		}
	};
	reader.readAsText(file);
}

function convertToJsTreeData(obj, path = '') {
	return Object.entries(obj).map(([key, val]) => {
		const hasChildren = typeof val === 'object' && Object.keys(val).length > 0;
		const id = path + '/' + key;
		return {
			id,
			text: key,
			children: hasChildren ? convertToJsTreeData(val, id) : [],
			originalLeaf: !hasChildren,
			sensor: false
		};
	});
}

function createSensorMap(sensorArray) {
	const map = {};
	sensorArray.forEach(sensorObj => {
		for (const [key, value] of Object.entries(sensorObj)) {
			map[key] = value;
		}
	});
	return map;
}

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


//
// Tree initaializations
//
initializeTree(tree);

//
// Config functions
//
function importConfig(event) {
	alert("Not iplemented yet");
}

function transformJsTreeNodesToConfig(nodes) {
  const result = {};

  nodes.forEach(node => {
    // If node has children, recursively transform children
    if (node.children && node.children.length > 0) {
      result[node.text] = transformJsTreeNodesToConfig(node.children);
      // Optionally include other node metadata if needed
      if (node.data && node.data.description) {
        result[node.text].description = node.data.description;
      }
    } else {
      // Leaf node: construct sensor object with properties from node.data
      // Adjust property names depending on how you stored them
      const sensorData = {};

      if (node.data) {
        if (node.data.values) sensorData.values = node.data.values;
        if (node.data.min_value !== undefined) sensorData.min_value = node.data.min_value;
        if (node.data.max_value !== undefined) sensorData.max_value = node.data.max_value;
        if (node.data.actions) sensorData.actions = node.data.actions;
        if (node.data.description) sensorData.description = node.data.description;
      }

      // If no sensor data, fallback to just description or empty object
      if (Object.keys(sensorData).length === 0) {
        sensorData.description = node.data && node.data.description ? node.data.description : "";
      }

      result[node.text] = sensorData;
    }
  });

  return result;
}

function exportConfig(event) {
  const mainTree = $('#tree').jstree(true);
  if (!mainTree) {
    alert('Main tree not initialized');
    return;
  }

  // Get jsTree data array (root-level nodes)
  const treeNodes = mainTree.get_json('#', { flat: false });

  // Transform jsTree node array into your nested config object
  const config = {
    home: transformJsTreeNodesToConfig(treeNodes)
  };

  // JSON stringify pretty
  const jsonStr = JSON.stringify(config, null, 2);

  // Create blob and download
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "config.json";
  document.body.appendChild(a);
  a.click();

  // Cleanup
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

