/**
 * SmartHub - AI powered Smart Home
 * Editor JS lib
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.6.4
 * @license MIT
 */
const areaForm = document.getElementById('areaForm');
const areaNameInput = document.getElementById('areaName');
const areasList = document.getElementById('areasList');
const submitBtn = document.getElementById('submitBtn');

let areas = [];
let editing = { type: null, areaIndex: -1, floorIndex: -1 }; 
// type: 'area' or 'floor' or null; editing which item

function loadAreas() {
  const saved = localStorage.getItem('homeAreas');
  if (saved) {
    areas = JSON.parse(saved);
  } else {
    areas = [
      { name: 'inside', floors: [] },
      { name: 'outside', floors: [] }
    ];
    saveAreas();
  }
}

function saveAreas() {
  localStorage.setItem('homeAreas', JSON.stringify(areas));
}

function renderAreas() {
  areasList.innerHTML = '';
  if (areas.length === 0) {
    areasList.innerHTML = `<li class="list-group-item text-muted">No areas found</li>`;
    return;
  }

  areas.forEach((area, areaIdx) => {
    const li = document.createElement('li');
    li.className = 'list-group-item';

    // Area header with edit/delete
    const areaHeader = document.createElement('div');
    areaHeader.className = 'd-flex justify-content-between align-items-center mb-2';

    if (editing.type === 'area' && editing.areaIndex === areaIdx) {
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'form-control me-2';
      input.value = area.name;
      input.style.flexGrow = '1';

      const saveBtn = document.createElement('button');
      saveBtn.className = 'btn btn-sm btn-success me-2';
      saveBtn.textContent = 'Save';
      saveBtn.addEventListener('click', () => {
        const newValue = input.value.trim();
        if (!newValue) {
          alert('Area name cannot be empty!');
          input.focus();
          return;
        }
        if (areas.some((a, i) => a.name === newValue && i !== areaIdx)) {
          alert('Another area with this name exists!');
          input.focus();
          return;
        }
        areas[areaIdx].name = newValue;
        editing = { type: null, areaIndex: -1, floorIndex: -1 };
        saveAreas();
        renderAreas();
      });

      const cancelBtn = document.createElement('button');
      cancelBtn.className = 'btn btn-sm btn-secondary';
      cancelBtn.textContent = 'Cancel';
      cancelBtn.addEventListener('click', () => {
        editing = { type: null, areaIndex: -1, floorIndex: -1 };
        renderAreas();
      });

      areaHeader.appendChild(input);
      areaHeader.appendChild(saveBtn);
      areaHeader.appendChild(cancelBtn);

      input.focus();
      input.select();
    } else {
      // Display mode
      const nameSpan = document.createElement('span');
      nameSpan.textContent = area.name;
      nameSpan.style.fontWeight = '600';

      const btnGroup = document.createElement('div');

      const editBtn = document.createElement('button');
      editBtn.className = 'btn btn-sm btn-outline-secondary me-2';
      editBtn.textContent = 'Edit';
      editBtn.addEventListener('click', () => {
        if (editing.type !== null) {
          alert('Finish editing before editing another item.');
          return;
        }
        editing = { type: 'area', areaIndex: areaIdx, floorIndex: -1 };
        renderAreas();
      });

      const delBtn = document.createElement('button');
      delBtn.className = 'btn btn-sm btn-outline-danger';
      delBtn.textContent = 'Delete';
      delBtn.addEventListener('click', () => {
        if (editing.type !== null) {
          alert('Finish editing before deleting an item.');
          return;
        }
        if (confirm(`Are you sure you want to delete area "${area.name}" and all its floors?`)) {
          areas.splice(areaIdx, 1);
          saveAreas();
          renderAreas();
        }
      });

      btnGroup.appendChild(editBtn);
      btnGroup.appendChild(delBtn);

      areaHeader.appendChild(nameSpan);
      areaHeader.appendChild(btnGroup);
    }

    li.appendChild(areaHeader);

    // Floors list for this area
    const floorsList = document.createElement('ul');
    floorsList.className = 'list-group mb-2';

    if (area.floors.length === 0) {
      const emptyLi = document.createElement('li');
      emptyLi.className = 'list-group-item text-muted small';
      emptyLi.textContent = '(No floors)';
      floorsList.appendChild(emptyLi);
    } else {
      area.floors.forEach((floor, floorIdx) => {
        const floorLi = document.createElement('li');
        floorLi.className = 'list-group-item d-flex justify-content-between align-items-center';

        if (editing.type === 'floor' && editing.areaIndex === areaIdx && editing.floorIndex === floorIdx) {
          // Edit floor inline
          const input = document.createElement('input');
          input.type = 'text';
          input.className = 'form-control me-2';
          input.value = floor;
          input.style.flexGrow = '1';

          const saveBtn = document.createElement('button');
          saveBtn.className = 'btn btn-sm btn-success me-2';
          saveBtn.textContent = 'Save';
          saveBtn.addEventListener('click', () => {
            const newValue = input.value.trim();
            if (!newValue) {
              alert('Floor name cannot be empty!');
              input.focus();
              return;
            }
            if (area.floors.some((f, idx) => f === newValue && idx !== floorIdx)) {
              alert('Another floor with this name exists in this area!');
              input.focus();
              return;
            }
            areas[areaIdx].floors[floorIdx] = newValue;
            editing = { type: null, areaIndex: -1, floorIndex: -1 };
            saveAreas();
            renderAreas();
          });

          const cancelBtn = document.createElement('button');
          cancelBtn.className = 'btn btn-sm btn-secondary';
          cancelBtn.textContent = 'Cancel';
          cancelBtn.addEventListener('click', () => {
            editing = { type: null, areaIndex: -1, floorIndex: -1 };
            renderAreas();
          });

          floorLi.appendChild(input);
          floorLi.appendChild(saveBtn);
          floorLi.appendChild(cancelBtn);

          input.focus();
          input.select();
        } else {
          // Display floor normally
          const span = document.createElement('span');
          span.textContent = floor;

          const btnGroup = document.createElement('div');

          const editBtn = document.createElement('button');
          editBtn.className = 'btn btn-sm btn-outline-secondary me-2';
          editBtn.textContent = 'Edit';
          editBtn.addEventListener('click', () => {
            if (editing.type !== null) {
              alert('Finish editing before editing another item.');
              return;
            }
            editing = { type: 'floor', areaIndex: areaIdx, floorIndex: floorIdx };
            renderAreas();
          });

          const delBtn = document.createElement('button');
          delBtn.className = 'btn btn-sm btn-outline-danger';
          delBtn.textContent = 'Delete';
          delBtn.addEventListener('click', () => {
            if (editing.type !== null) {
              alert('Finish editing before deleting an item.');
              return;
            }
            if (confirm(`Are you sure you want to delete floor "${floor}"?`)) {
              areas[areaIdx].floors.splice(floorIdx, 1);
              saveAreas();
              renderAreas();
            }
          });

          btnGroup.appendChild(editBtn);
          btnGroup.appendChild(delBtn);

          floorLi.appendChild(span);
          floorLi.appendChild(btnGroup);
        }

        floorsList.appendChild(floorLi);
      });
    }

    // Add floor input and button for this area (disabled if editing anything)
    const addFloorDiv = document.createElement('div');
    addFloorDiv.className = 'input-group';

    const floorInput = document.createElement('input');
    floorInput.type = 'text';
    floorInput.className = 'form-control';
    floorInput.placeholder = `Add floor inside "${area.name}"`;
    floorInput.disabled = editing.type !== null;

    const addFloorBtn = document.createElement('button');
    addFloorBtn.className = 'btn btn-outline-primary';
    addFloorBtn.textContent = 'Add Floor';
    addFloorBtn.disabled = editing.type !== null;

    addFloorBtn.addEventListener('click', () => {
      const floorName = floorInput.value.trim();
      if (!floorName) return alert('Floor name cannot be empty!');
      if (area.floors.includes(floorName)) {
        alert('Floor already exists in this area!');
        return;
      }
      areas[areaIdx].floors.push(floorName);
      saveAreas();
      renderAreas();
    });

    floorInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addFloorBtn.click();
      }
    });

    addFloorDiv.appendChild(floorInput);
    addFloorDiv.appendChild(addFloorBtn);

    li.appendChild(floorsList);
    li.appendChild(addFloorDiv);

    areasList.appendChild(li);
  });
}

areaForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (editing.type !== null) {
    alert('Finish editing before adding new areas.');
    return;
  }
  const name = areaNameInput.value.trim();
  if (!name) return;
  if (areas.some(a => a.name === name)) {
    alert('Area already exists!');
    return;
  }
  areas.push({ name, floors: [] });
  saveAreas();
  renderAreas();
  areaForm.reset();
});

loadAreas();
renderAreas();
