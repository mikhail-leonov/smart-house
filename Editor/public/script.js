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

let $clicked;

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

function rndId(length = 12) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function getFullPath(e) {
	const pathParts = [];
	let el = e;
	while (el && el.tagName === 'LI') {
		// Try to get node name/id from data attributes, fallback to trimmed text content
		const nodeName = el.dataset.node || el.dataset.name || el.textContent.trim();
		if (nodeName) {
			pathParts.unshift(nodeName); // prepend to array
		}
		el = el.parentElement;
		if (!el) { break; }
		if (el.tagName === 'UL') {
			el = el.parentElement;
		} else {
			break;
		}	
	}
	return pathParts.join('/');
}


$(document).ready(function () {
	$('#tree').on('click', 'li', function (e) {
		e.stopPropagation();
		const $this = $(this);
		if ($clicked && $clicked[0] === $this[0]) {
			$clicked = null;
			$this.removeClass('active');
			$this.find('.edit-btn').remove();
			return;
		}
		$('#tree .edit-btn').remove();        // Remove all edit buttons
		$('#tree li').removeClass('active');  // Unmark all
		$this.addClass('active');             // Mark this one
		$clicked = $this;                     // Save reference
		const depth = $this.parentsUntil('#tree', 'ul').length + 1;
		if (depth <= 5) {
			const $editBtn = $('<span>')
				.addClass('edit-btn text-primary ms-2')
				.text('[edit]')
				.css({
					cursor: 'pointer',
					fontSize: '0.85em'
				})
				.attr('title', 'Edit this section')
				.click(function (ev) {
					ev.stopPropagation();
					editTreeElement();
				});
			let inserted = false;
			$this.contents().each(function () {
				if (this.nodeType === Node.TEXT_NODE && this.nodeValue.trim() !== '' && !inserted) {
					$(this).after($editBtn);
					inserted = true;
				}
			});
			if (!inserted) {
				$this.prepend($editBtn);
			}
		}
	});
});

document.addEventListener('dragstart', function (e) {

    e.dataTransfer.setData('drop-sensorName', e.target.dataset.sensorName);
    
	const desc = e.target.dataset.sensorDescription || "";
	e.dataTransfer.setData('drop-sensorDescription', desc);
	
	const min = e.target.dataset.sensorMin ?? 0
    e.dataTransfer.setData('drop-sensorMin', min);
	
	const max = e.target.dataset.sensorMax ?? 0;
    e.dataTransfer.setData('drop-sensorMax', max);
	
	const values = e.target.dataset.sensorValues ?? [];
    e.dataTransfer.setData('drop-sensorValues', values);
	
	const actions = e.target.dataset.sensorActions ?? [];
    e.dataTransfer.setData('drop-sensorActions', actions);
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
		
		exportSensor.values = sensor.values || [];
		exportSensor.min_value = sensor.min;
		exportSensor.max_value = sensor.max;
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
console.log("importSensors");
	const file = event.target.files?.[0];
	if (!file) { return; }
	const reader = new FileReader();
	reader.onload = function (e) {
		try {
			const sensorsObj = JSON.parse(e.target.result);
			sensors = [];
			for (const [name, sensor] of Object.entries(sensorsObj)) {
				if (sensor.description) { 
					const newSensor = { name, description: sensor.description };
					newSensor.min = sensor.min_value ?? 0;
					newSensor.max = sensor.max_value ?? 0;
					newSensor.values = sensor.values ?? "";
					newSensor.actions = sensor.actions ?? "";
					sensors.push(newSensor);
				}
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
		link.dataset.sensorMin = meta.min_value ?? 0;
		link.dataset.sensorMax = meta.max_value ?? 0;
		link.dataset.sensorValues = meta.values ?? "[]";
		link.dataset.sensorActions = meta.actions ?? "[]";
		
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

function showSensorModal(meta) {
	$('#sensorId').val(meta.sensorId || rndId() );
	$('#sensorName').val(meta.sensorName || '');
	$('#sensorDescription').val(meta.sensorDescription || '');
	$('#sensorIsNew').val('false');
	document.getElementById('deleteSensorBtn').style.visibility = 'visible';
	
	$('#sensorMinValue').val(meta.sensorMin ?? '');
	$('#sensorMaxValue').val(meta.sensorMax ?? '');
	$('#sensorValues').val(meta.sensorValues ?? '');
	$('#sensorActions').val(meta.sensorActions ?? '');
	const modal = new bootstrap.Modal(document.getElementById('sensorEditModal'));
	modal.show();
}

function createNewSensor() {
	$('#sensorId').val( rndId() );
	$('#sensorName').val('');
	$('#sensorName').prop('readonly', false);
	$('#sensorDescription').val('');
	$('#sensorIsNew').val('true');
	document.getElementById('deleteSensorBtn').style.visibility = 'hidden';
	
	$('#sensorMinValue').val('');
	$('#sensorMaxValue').val('');
	$('#sensorValues').val('');
	$('#sensorActions').val('');
	const modal = new bootstrap.Modal(document.getElementById('sensorEditModal'));
	modal.show();
}


document.getElementById('deleteSensorBtn').addEventListener('click', function (e) {
	const sensorId = $('#sensorId').val();
	if (sensorId) {
		const confirmed = confirm("Are you sure you want to delete this sensor?");
		if (confirmed) { 
			delete sensors[sensorId];
			renderSensors(sensors);
			// Close the modal
			const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('sensorEditModal'));
			modal.hide();
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
	const exportObj = { home: tree.home };
	const jsonStr = JSON.stringify(exportObj, null, 2);
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
					
					const sensorName = e.dataTransfer.getData('drop-sensorName');
					
					const sensorWrapper = document.createElement('span');
					sensorWrapper.className = 'mb-1 d-flex align-items-center';
					
					if (!sensorName) { return; }
					// Check if sensor name is already present
					const alreadyExists = Array.from(li.querySelectorAll('div')).some(div => div.textContent === sensorName);
					if (alreadyExists) { return; }
					// Find sensor ID by name (optional, if you want description)
					const sensorId = findSensorIdByName(sensorName);
					const sensorDiv = document.createElement('div');
					sensorDiv.className = 'me-1'; 
					sensorDiv.textContent = " - " + sensorName;
					
					sensorDiv.dataset.sensorDescription = e.dataTransfer.getData('drop-sensorDescription');
					sensorDiv.dataset.sensorMin = e.dataTransfer.getData('drop-sensorMin');
					sensorDiv.dataset.sensorMax = e.dataTransfer.getData('drop-sensorMax');
					sensorDiv.dataset.sensorValues = e.dataTransfer.getData('drop-sensorValues');
					sensorDiv.dataset.sensorActions = e.dataTransfer.getData('drop-sensorActions');
					sensorDiv.title = sensorId ? sensors[sensorId]?.description || '' : '';
					
					const deleteChar = document.createElement('span');
					deleteChar.textContent = ' x ';
					deleteChar.style.color = 'red';
					deleteChar.style.cursor = 'pointer';
					deleteChar.onclick = () => { 
						sensorWrapper.remove();
					}
					
					sensorWrapper.appendChild(sensorDiv);
					sensorWrapper.appendChild(deleteChar);
					
					li.appendChild(sensorWrapper);
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

function createNewTreeElement() {
	if (!$clicked) { return; }
	let e = $clicked;
	if (e.length > 0) {
		e = e[0];
	}
	const parentPath = getFullPath(e);
	const parts = parentPath.split('/');
	const parentName = parts[parts.length - 1] || '';
	$('#treeNodeParentPath').val(parentPath);
	$('#treeNodeParentName').val(parentName);
	$('#treeNodeName').val('');
	$('#treeNodeName').prop('readonly', false);
	document.getElementById('deleteTreeElementBtn').style.visibility = 'hidden';

	const modal = new bootstrap.Modal(document.getElementById('treeNodeEditModal'));
	modal.show();
}

function insertNode(tree, path, newNodeName) {
	if (!path) {
		tree[newNodeName] = {};
		return;
	}
	const parts = path.split('/'); // split path into keys
	let current = tree;
	for (const part of parts) {
		if (!(part in current)) {
			current[part] = {};
		}
		current = current[part];
	}
	if (!(newNodeName in current)) {
		current[newNodeName] = {};
	} else {
		console.warn(`Node "${newNodeName}" already exists at path "${path}"`);
	}
}


function editTreeElement() { 
	if (!$clicked) { return; }
	let e = $clicked;
	if (e.length > 0) {
		e = e[0];
	}
	const parentPath = getFullPath(e);
	const parts = parentPath.split('/');
	const name = parts[parts.length - 1] || '';
	const parentName = parts[parts.length - 1] || '';
	$('#treeNodeParentPath').val(parentPath);
	$('#treeNodeParentName').val(parentName);
	$('#treeNodeName').val(name);
	document.getElementById('deleteTreeElementBtn').style.visibility = '';
	const modal = new bootstrap.Modal(document.getElementById('treeNodeEditModal'));
	modal.show();
}




document.getElementById('saveTreeElementBtn').addEventListener('click', function (e) {
	const name = $('#treeNodeName').val().trim();
	const parentPath = $('#treeNodeParentPath').val();
	if (!name) {
		alert("Node name is required.");
		return;
	}
	insertNode(tree, parentPath, name);
	renderTree(tree); 
	bootstrap.Modal.getInstance(document.getElementById('treeNodeEditModal')).hide();
});






//
// Config part
//

function getFirstTextNodeText(el) {
  for (const node of el.childNodes) {
    if (node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== '') {
      return node.textContent.trim();
    }
  }
  return null;
}

function buildConfigFromTree2() {
    const result = {};
	const $root = $('#tree');
	if ($root.length) {
		for (const child of $root[0].children) {
			for (const child2 of child.children) {
				const key2 = getFirstTextNodeText(child2);
				if (key2) { result[key2] = {}; }
				for (const child3 of child2.children) {
					for (const child4 of child3.children) {
						const key4 = getFirstTextNodeText(child4);
						if (key4) { result[key2][key4] = {}; }
						for (const child5 of child4.children) {
							for (const child6 of child5.children) {
								const key6 = getFirstTextNodeText(child6);
								if (key6) { result[key2][key4][key6] = {}; }
								for (const child7 of child6.children) {
									for (const child8 of child7.children) {
										const key8 = getFirstTextNodeText(child8);
										if (key8) { result[key2][key4][key6][key8] = {}; }
										for (const child9 of child8.children) {
											for (const child10 of child9.children) {
												let key10 = getFirstTextNodeText(child10);
												if (key10) { 
													if (key10.trim() !== "x" ) { 
														key10 = key10.trim();
														if (key10.startsWith('-')) {
															key10 = key10.slice(1).trim(); 
														}
														key10 = key10.split(' ').join('');
														
														let sensor = {}
														sensor["description"] = child10.dataset.sensorDescription;
														sensor["values"] = child10.dataset.sensorValues;
														sensor["min_value"] = child10.dataset.sensorMin;
														sensor["max_value"] = child10.dataset.sensorMax;
														sensor["actions"] = child10.dataset.sensorActions;
														
  														result[key2][key4][key6][key8][key10] = JSON.stringify(sensor);
													}
												}
											}	
										}
									}
								}
							}	
						}
					}
				}
			}
		}
	}
	return result;
}

function buildConfigFromTree() {
    const result = {};
    const $root = $('#tree');

    if (!$root.length) return result;

    for (const child of $root[0].children) {
        for (const child2 of child.children) {
            const key2 = getFirstTextNodeText(child2);
            if (!key2) continue;
            result[key2] = {};

            for (const child3 of child2.children) {
                for (const child4 of child3.children) {
                    const key4 = getFirstTextNodeText(child4);
                    if (!key4) continue;
                    result[key2][key4] = {};
					
                    for (const child5 of child4.children) {
                        for (const child6 of child5.children) {
                            const key6 = getFirstTextNodeText(child6);
                            if (!key6) continue;
                            result[key2][key4][key6] = {};

                            for (const child7 of child6.children) {
                                for (const child8 of child7.children) {
                                    const key8 = getFirstTextNodeText(child8);
                                    if (!key8) continue;
                                    result[key2][key4][key6][key8] = {};

                                    for (const child9 of child8.children) {
                                        for (const child10 of child9.children) {
                                            let key10 = getFirstTextNodeText(child10);
                                            if (!key10 || key10.trim() === 'x') continue;

                                            key10 = key10.trim().replace(/^-\s*/, '').replace(/\s+/g, '');
											
                                            const sensor = {};
                                            const ds = child10.dataset;
                                            sensor.description = ds.sensorDescription;
                                            sensor.values = ds.sensorValues.split(',').map(v => v.trim()).filter(Boolean);
                                            sensor.min_value = ds.sensorMin ? ds.sensorMin : 0;
                                            sensor.max_value = ds.sensorMax ? ds.sensorMax : 0;
                                            sensor.actions = ds.sensorActions.split(',').map(a => a.trim()).filter(Boolean);
											
                                            result[key2][key4][key6][key8][key10] = JSON.stringify(sensor);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    return result;
}

function exportConfig () { 
	const config = buildConfigFromTree();
	let  jsonStr = JSON.stringify(config, null, 2);
	jsonStr = jsonStr.split('\\').join(''); 
	jsonStr = jsonStr.split('  ').join(' ');
	jsonStr = jsonStr.split('"{').join('{');
	jsonStr = jsonStr.split('}"').join('}');
	const blob = new Blob([jsonStr], { type: "application/json" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = "tree.json";
	a.click();
	URL.revokeObjectURL(url);
}

function importConfig () { 

alert("!");


}
