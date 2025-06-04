/**
 * SmartHub - AI powered Smart Home
 * App which is running and read rules and try to validate them with AI and send command to a Controller 
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Ivan Leonov ivanleonov1002@gmail.com 
 * @version 0.6.8
 * @license MIT
 */

let properties = [];
let tree = {
    name: "Home",
    type: "root",
    children: []
};

let usedIds = new Set();
let collapsedStates = {};

function generateId() {
    let id;
    do {
        id = Math.floor(Math.random() * 65536);
    } while (usedIds.has(id));
    usedIds.add(id);
    return id.toString();
}

function getDomId(id, suffix) {
    return `id-${id}-${suffix}`;
}

// Property Management
function toggleRangeInputs() {
    const type = document.getElementById('propertyType').value;
    const rangeInputs = document.getElementById('rangeInputs');
    rangeInputs.style.display = type === 'range' ? 'flex' : 'none';
}

function addProperty() {
    const name = document.getElementById('propertyName').value.trim();
    const type = document.getElementById('propertyType').value;
    
    if (!name || !type) {
        alert('Please enter a property name and select a type.');
        return;
    }
    
    const property = {
        name,
        type,
        range: type === 'range' ? {
            min: parseFloat(document.getElementById('minValue').value),
            max: parseFloat(document.getElementById('maxValue').value)
        } : null
    };
    
    if (type === 'range' && (isNaN(property.range.min) || isNaN(property.range.max))) {
        alert('Please enter valid min and max values for range type.');
        return;
    }
    
    if (properties.some(p => p.name === name)) {
        alert('Property with this name already exists.');
        return;
    }
    
    properties.push(property);
    updatePropertyList();
    document.getElementById('propertyName').value = '';
    document.getElementById('propertyType').value = '';
    document.getElementById('minValue').value = '';
    document.getElementById('maxValue').value = '';
    document.getElementById('rangeInputs').style.display = 'none';
}

function updatePropertyList() {
    const list = document.getElementById('propertyList');
    list.innerHTML = properties.map(p => `
        <div class="property-item">
            <div class="property-name">${p.name}</div>
            <div class="property-type">${p.type === 'range' ? 
                `Range (${p.range.min} to ${p.range.max})` : 'Binary (On/Off)'}
            </div>
            <button onclick="deleteProperty('${p.name}')">🗑️ Delete</button>
        </div>
    `).join('');
    updatePropertySelectOptions();
}

function deleteProperty(name) {
    // Remove property from all rooms first
    for (let loc of tree.children) {
        for (let floor of loc.floors) {
            for (let room of floor.rooms) {
                room.properties = room.properties.filter(p => p !== name);
            }
        }
    }
    // Then remove from properties list
    properties = properties.filter(p => p.name !== name);
    updatePropertyList();
    updateTree();
}

function exportProperties() {
    const data = JSON.stringify(properties);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'properties.json';
    a.click();
    URL.revokeObjectURL(url);
}

function importProperties() {
    const file = document.getElementById('importProperties').files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                properties = JSON.parse(e.target.result);
                updatePropertyList();
            } catch (error) {
                alert('Error: Invalid JSON file for properties.');
            }
        };
        reader.readAsText(file);
    }
}

// Modal Handlers
function openAddNodeModal(type, parentId, parentElementId, level, isEditing = false, nodeId = '') {
    const modal = document.getElementById('addNodeModal');
    const modalTitle = modal.querySelector('h2');
    modalTitle.textContent = isEditing ? 'Edit Node' : 'Add New Node';
    document.getElementById('nodeType').value = type;
    document.getElementById('nodeParentId').value = parentId;
    document.getElementById('nodeParentElementId').value = parentElementId;
    document.getElementById('nodeLevel').value = level;
    document.getElementById('nodeId').value = nodeId;
    document.getElementById('nodeName').value = isEditing ? findNode(nodeId, level)?.name || '' : '';
    modal.style.display = 'block';
}

function closeAddNodeModal() {
    document.getElementById('addNodeModal').style.display = 'none';
}

function openAssignPropertyModal(roomId) {
    const modal = document.getElementById('assignPropertyModal');
    document.getElementById('roomId').value = roomId;
    updatePropertySelectOptions();
    modal.style.display = 'block';
}

function closeAssignPropertyModal() {
    document.getElementById('assignPropertyModal').style.display = 'none';
}

function updatePropertySelectOptions() {
    const select = document.getElementById('propertySelect');
    select.innerHTML = '<option value="">Select Property</option>' + 
        properties.map(p => `<option value="${p.name}">${p.name} (${p.type === 'range' ? 'Range' : 'Binary'})</option>`).join('');
}

// Tree Management
function addNode(type, parent, parentElementId, level, name) {
    if (!name) {
        alert('Name is required.');
        return;
    }

    const newNode = { 
        id: generateId(), 
        name, 
        type: level === 2 ? 'location' : level === 3 ? 'floor' : 'room',
        properties: []
    };

    if (level === 2) {
        newNode.floors = [];
        parent.children.push(newNode);
    } else if (level === 3) {
        newNode.rooms = [];
        parent.floors.push(newNode);
    } else if (level === 4) {
        parent.rooms.push(newNode);
    }
    updateTree();
}

function deleteNode(id, level) {
    if (level === 2) {
        tree.children = tree.children.filter(n => n.id !== id);
    } else if (level === 3) {
        for (let loc of tree.children) {
            loc.floors = loc.floors.filter(f => f.id !== id);
        }
    } else if (level === 4) {
        for (let loc of tree.children) {
            for (let floor of loc.floors) {
                floor.rooms = floor.rooms.filter(r => r.id !== id);
            }
        }
    }
    usedIds.delete(id);
    updateTree();
}

function editNode(id, parentId, level) {
    const parent = parentId === 'tree' ? tree : findNode(parentId, level - 1);
    const node = findNode(id, level);
    if (node && parent) {
        openAddNodeModal(level === 2 ? 'location' : level === 3 ? 'floor' : 'room', 
                        parentId, 
                        parent.id ? getDomId(parent.id, level === 3 ? 'floors' : 'rooms') : 'locations', 
                        level, 
                        true, 
                        id);
    } else {
        alert('Error: Node or parent not found.');
    }
}

function findNode(id, level) {
    if (level === 2) {
        return tree.children.find(n => n.id === id);
    } else if (level === 3) {
        for (let loc of tree.children) {
            const found = loc.floors.find(f => f.id === id);
            if (found) return found;
        }
    } else if (level === 4) {
        for (let loc of tree.children) {
            for (let floor of loc.floors) {
                const found = floor.rooms.find(r => r.id === id);
                if (found) return found;
            }
        }
    }
    return null;
}

function addPropertyToRoom(roomId, propertyName) {
    if (!propertyName) {
        alert('Please select a property.');
        return;
    }
    const room = findNode(roomId, 4);
    if (room) {
        if (!room.properties.includes(propertyName)) {
            room.properties.push(propertyName);
            updateTree();
        }
    } else {
        alert('Error: Room not found.');
    }
}

function removePropertyFromRoom(roomId, propertyName) {
    if (!propertyName) {
        return;
    }
    const room = findNode(roomId, 4);
    if (room) {
        room.properties = room.properties.filter(p => p !== propertyName);
        updateTree();
    }
}

function toggleCollapse(element) {
    const content = element.nextElementSibling;
    const icon = element.querySelector('.collapse-icon');
    const nodeId = element.closest('.node').id || 'root';
    
    if (content.style.display === 'none') {
        content.style.display = 'block';
        icon.textContent = '-';
        collapsedStates[nodeId] = false;
    } else {
        content.style.display = 'none';
        icon.textContent = '+';
        collapsedStates[nodeId] = true;
    }
}

function updateTree() {
    const container = document.getElementById('locations');
    if (!container) return;
    
    // Save current collapsed states
    const nodes = document.querySelectorAll('.node');
    nodes.forEach(node => {
        const header = node.querySelector('.node-header-container');
        if (header) {
            const content = header.nextElementSibling;
            const nodeId = node.id || 'root';
            collapsedStates[nodeId] = content.style.display === 'none';
        }
    });
    
    container.innerHTML = '';
    
    tree.children.forEach(node => {
        const nodeDiv = document.createElement('div');
        nodeDiv.className = 'node level-2';
        nodeDiv.id = `node-${node.id}`;
        const isCollapsed = collapsedStates[`node-${node.id}`] || false;
        
        nodeDiv.innerHTML = `
            <div class="node-header-container">
                <div class="node-title-container">
                    <h5>${node.name} (House Area)</h5>
                    <button class="edit-btn-inline" onclick="editNode('${node.id}', 'tree', 2)">✏️</button>
                </div>
                <div class="right-buttons">
                    <button class="delete-btn" onclick="deleteNode('${node.id}', 2)">🗑️ Delete</button>
                    <span class="collapse-icon" onclick="toggleCollapse(this.parentElement)">${isCollapsed ? '+' : '-'}</span>
                </div>
            </div>
            <div class="node-content" style="display: ${isCollapsed ? 'none' : 'block'}">
                <div class="controls">
                    <div class="left-buttons">
                        <button class="add-btn" onclick="openAddNodeModal('floor', '${node.id}', '${getDomId(node.id, 'floors')}', 3)">➕ Add Floor</button>
                    </div>
                </div>
                <div id="${getDomId(node.id, 'floors')}"></div>
            </div>
        `;
        container.appendChild(nodeDiv);
        
        const floorsDiv = nodeDiv.querySelector(`#${getDomId(node.id, 'floors').replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}`);
        if (!floorsDiv) return;
        
        node.floors.forEach(floor => {
            const floorDiv = document.createElement('div');
            floorDiv.className = 'node level-3';
            floorDiv.id = `floor-${floor.id}`;
            const isFloorCollapsed = collapsedStates[`floor-${floor.id}`] || false;
            
            floorDiv.innerHTML = `
                <div class="node-header-container">
                    <div class="node-title-container">
                        <h6>${floor.name} (Floor)</h6>
                        <button class="edit-btn-inline" onclick="editNode('${floor.id}', '${node.id}', 3)">✏️</button>
                    </div>
                    <div class="right-buttons">
                        <button class="delete-btn" onclick="deleteNode('${floor.id}', 3)">🗑️ Delete</button>
                        <span class="collapse-icon" onclick="toggleCollapse(this.parentElement)">${isFloorCollapsed ? '+' : '-'}</span>
                    </div>
                </div>
                <div class="node-content" style="display: ${isFloorCollapsed ? 'none' : 'block'}">
                    <div class="controls">
                        <div class="left-buttons">
                            <button class="add-btn" onclick="openAddNodeModal('room', '${floor.id}', '${getDomId(floor.id, 'rooms')}', 4)">➕ Add Room</button>
                        </div>
                    </div>
                    <div id="${getDomId(floor.id, 'rooms')}"></div>
                </div>
            `;
            floorsDiv.appendChild(floorDiv);
            
            const roomsDiv = floorDiv.querySelector(`#${getDomId(floor.id, 'rooms').replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}`);
            if (!roomsDiv) return;
            
            floor.rooms.forEach(room => {
                const roomDiv = document.createElement('div');
                roomDiv.className = 'node level-4';
                roomDiv.id = `room-${room.id}`;
                const isRoomCollapsed = collapsedStates[`room-${room.id}`] || false;
                
                // Create property list HTML
                let propertiesHtml = '<div class="property-list">';
                if (room.properties.length > 0) {
                    propertiesHtml += '<strong>Properties</strong><ul>';
                    room.properties.forEach(propName => {
                        const property = properties.find(p => p.name === propName);
                        propertiesHtml += `
                            <li class="property-list-item">
                                <div class="property-info">
                                    <div class="property-name">${propName}</div>
                                    <div class="property-type">
                                        ${property ? (
                                            property.type === 'range' ? 
                                            `Range: ${property.range.min} to ${property.range.max}` : 
                                            'Binary (On/Off)'
                                        ) : 'Type not found'}
                                    </div>
                                </div>
                                <button class="property-remove" onclick="removePropertyFromRoom('${room.id}', '${propName}')">➖ Remove</button>
                            </li>
                        `;
                    });
                    propertiesHtml += '</ul>';
                } else {
                    propertiesHtml += '<div class="empty-state">No properties assigned</div>';
                }
                propertiesHtml += '</div>';
                
                roomDiv.innerHTML = `
                    <div class="node-header-container">
                        <div class="node-title-container">
                            <p>${room.name} (Room)</p>
                            <button class="edit-btn-inline" onclick="editNode('${room.id}', '${floor.id}', 4)">✏️</button>
                        </div>
                        <div class="right-buttons">
                            <button class="delete-btn" onclick="deleteNode('${room.id}', 4)">🗑️ Delete</button>
                            <span class="collapse-icon" onclick="toggleCollapse(this.parentElement)">${isRoomCollapsed ? '+' : '-'}</span>
                        </div>
                    </div>
                    <div class="node-content" style="display: ${isRoomCollapsed ? 'none' : 'block'}">
                        <div class="controls">
                            <div class="left-buttons">
                                <button class="add-btn" onclick="openAssignPropertyModal('${room.id}')">➕ Assign Property</button>
                            </div>
                        </div>
                        ${propertiesHtml}
                    </div>
                `;
                roomsDiv.appendChild(roomDiv);
            });
        });
    });
}

function exportTree() {
    const data = JSON.stringify({ tree, properties }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'building_data.json';
    a.click();
    URL.revokeObjectURL(url);
}

function importTree() {
    const file = document.getElementById('importTree').files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                usedIds.clear();
                
                // Import properties
                if (importedData.properties) {
                    properties = importedData.properties;
                    updatePropertyList();
                }
                
                // Import tree structure
                if (importedData.tree) {
                    function collectIds(node, level) {
                        if (node.id) usedIds.add(node.id);
                        if (level === 2 && node.floors) {
                            node.floors.forEach(floor => collectIds(floor, 3));
                        } else if (level === 3 && node.rooms) {
                            node.rooms.forEach(room => collectIds(room, 4));
                        }
                    }
                    
                    if (importedData.tree.children) {
                        importedData.tree.children.forEach(loc => collectIds(loc, 2));
                    }
                    tree = importedData.tree;
                    updateTree();
                }
            } catch (error) {
                alert('Error: Invalid JSON file for import.');
            }
        };
        reader.readAsText(file);
    }
}

// Initialize when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Set up form event listeners
    document.getElementById('addNodeForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('nodeName').value.trim();
        const parentId = document.getElementById('nodeParentId').value;
        const parentElementId = document.getElementById('nodeParentElementId').value;
        const level = parseInt(document.getElementById('nodeLevel').value);
        const nodeId = document.getElementById('nodeId').value;
        
        const parent = parentId === 'tree' ? tree : findNode(parentId, level - 1);
        if (!parent) {
            alert('Error: Parent node not found.');
            return;
        }

        if (nodeId) {
            const node = findNode(nodeId, level);
            if (node) {
                node.name = name;
                updateTree();
                closeAddNodeModal();
            } else {
                alert('Error: Node not found.');
            }
        } else {
            const type = document.getElementById('nodeType').value;
            addNode(type, parent, parentElementId, level, name);
            closeAddNodeModal();
        }
    });

    document.getElementById('assignPropertyForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const roomId = document.getElementById('roomId').value;
        const property = document.getElementById('propertySelect').value;
        addPropertyToRoom(roomId, property);
        closeAssignPropertyModal();
    });

    // Initial render
    updatePropertyList();
    updateTree();
});