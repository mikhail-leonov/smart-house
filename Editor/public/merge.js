/**
 * SmartHub - AI powered Smart Home
 * App which is running and read rules and try to validate them with AI and send command to a Controller 
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Ivan Leonov ivanleonov1002@gmail.com 
 * @version 0.7.2
 * @license MIT
 */

// Flatten sensors keys and descriptions
const sensorsData = Object.entries(sensors[0]).map(([name, data]) => ({
	name, description: data.description || ''
}));

// Store assignments: room path string => array of sensor names
const assignments = {};
let selectedRoomLeaf = null;
let selectedRoomPath = null;

// Helper to create tree nodes from nested object
function createTreeNode(obj, path = []) {
	const ul = document.createElement('ul');
	for (const key in obj) {
		const li = document.createElement('li');
		li.textContent = key;
		const currentPath = [...path, key];
		const hasChildren = obj[key] && Object.keys(obj[key]).length > 0;
		if (hasChildren) {
			// Recursive children
			const childUl = createTreeNode(obj[key], currentPath);
			li.appendChild(childUl);
		} else {
			// Leaf node: clickable to select
			li.style.cursor = 'pointer';
			li.onclick = () => selectRoomLeaf(li, currentPath.join('.'));
		}
		ul.appendChild(li);
	}
	return ul;
}

// Render the rooms tree inside container
function renderRoomsTree() {
	const container = document.getElementById('roomsTree');
	container.innerHTML = '';
	container.appendChild(createTreeNode(tree));  // renamed here
}

// Render sensors as checkbox list
function renderSensors() {
	const container = document.getElementById('sensorList');
	container.innerHTML = '';
	sensorsData.forEach(sensor => {
		const label = document.createElement('label');
		label.style.display = 'block';
		const checkbox = document.createElement('input');
		checkbox.type = 'checkbox';
		checkbox.value = sensor.name;
		label.appendChild(checkbox);
		label.appendChild(document.createTextNode(` ${sensor.name} — ${sensor.description}`));
		container.appendChild(label);
	});
}

// Select a leaf node of the tree (room)
function selectRoomLeaf(element, roomPath) {
	// Remove highlight from old selection
	if (selectedRoomLeaf) selectedRoomLeaf.style.backgroundColor = '';
	selectedRoomLeaf = element;
	selectedRoomPath = roomPath;
	// Highlight new selection
	selectedRoomLeaf.style.backgroundColor = '#ddd';
	document.getElementById('assignBtn').disabled = false;
	renderAssignedSensors(roomPath);
}

// Show assigned sensors for selected room path
function renderAssignedSensors(roomPath) {
	const div = document.getElementById('assignedSensors');
	const assigned = assignments[roomPath] || [];
	if (assigned.length === 0) {
		div.textContent = `No sensors assigned to "${roomPath}".`;
	} else {
		div.textContent = `Sensors assigned to "${roomPath}": ${assigned.join(', ')}`;
	}
}

// Assign selected sensors to the selected room leaf
function assignSensors() {
	if (!selectedRoomPath) return;
	const checkedBoxes = Array.from(document.querySelectorAll('#sensorList input[type=checkbox]:checked'));
	const selectedSensors = checkedBoxes.map(cb => cb.value);

	assignments[selectedRoomPath] = selectedSensors;

	renderAssignedSensors(selectedRoomPath);

	// Clear checkboxes after assignment
	checkedBoxes.forEach(cb => (cb.checked = false));
}

// Initialize UI after DOM loaded
window.addEventListener('DOMContentLoaded', () => {
	renderRoomsTree();
	renderSensors();
	document.getElementById('assignBtn').onclick = assignSensors;
});