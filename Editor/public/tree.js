/**
 * SmartHub - AI powered Smart Home
 * App which is running and read rules and try to validate them with AI and send command to a Controller 
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Ivan Leonov ivanleonov1002@gmail.com 
 * @version 0.7.2
 * @license MIT
 */

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

	if (!currentEdit) return;

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

