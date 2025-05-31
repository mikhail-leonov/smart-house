/**
 * SmartHub - AI powered Smart Home
 * Browser generate config file
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.6.4
 * @license MIT
 */

function generateConfigSection(location, floor) {
    let elements = document.querySelectorAll(`div[data-location="${location}"][data-floor="${floor}"]`);
    let section = {};
    elements.forEach(el => {
        sectionName = el.getAttribute('data-room');
        if (!section[sectionName]) {
            section[sectionName] = {};
        }
        const actions = generateSectionVariables(el);
        Object.assign(section[sectionName], actions);
    });
    return section;
}

function generateActionsSection(location, floor) {
    let elements = document.querySelectorAll(`div[data-location="${location}"][data-floor="${floor}"]`);
    let section = {};

    elements.forEach(el => {
        const roomName = el.getAttribute('data-room');
        const actions = generateActionsVariables(el);

        if (actions && Object.keys(actions).length > 0) {
            if (!section[roomName]) {
                section[roomName] = {};
            }
            Object.assign(section[roomName], actions);
        }
    });

    // Return section only if it has rooms
    return Object.keys(section).length > 0 ? section : null;
}

function generateActions() {
    let config = {};
    config.home = {};
    config.home.inside = {};
    config.home.inside.house = generateActionsSection("inside", "house");
    config.home.inside.first_floor = generateActionsSection("inside", "first_floor");
    config.home.inside.second_floor = generateActionsSection("inside", "second_floor");
    config.home.outside = {};
    config.home.outside.first_floor = generateActionsSection("outside", "first_floor");
    const configText = document.getElementById('config_text');
    configText.innerText = formatJSON(config);
}

function generateConfig() {
    let config = {};
    config.home = {};
    config.home.inside = {};
    config.home.inside.house = generateConfigSection("inside", "house");
    config.home.inside.first_floor = generateConfigSection("inside", "first_floor");
    config.home.inside.second_floor = generateConfigSection("inside", "second_floor");
    config.home.outside = {};
    config.home.outside.first_floor = generateConfigSection("outside", "first_floor");
    const configText = document.getElementById('config_text');
    configText.innerText = formatJSON(config);
}

function formatJSON(obj, indentLevel = 0) {
    const indent = '  '.repeat(indentLevel);

    function isLeafObject(o) {
        return typeof o === 'object' && o !== null && !Array.isArray(o) && Object.values(o).every(val => typeof val !== 'object' || val === null || Array.isArray(val));
    }
    if (Array.isArray(obj)) {
        const items = obj.map(item => formatJSON(item, indentLevel + 1));
        return `[\n${items.map(i => indent + '  ' + i).join(',\n')}\n${indent}]`;
    } else if (typeof obj === 'object' && obj !== null) {
        if (isLeafObject(obj)) {
            const inline = Object.entries(obj).map(
                ([k, v]) => `"${k}": ${JSON.stringify(v)}`).join(', ');
            return `{ ${inline} }`;
        } else {
            const entries = Object.entries(obj).map(
                ([k, v]) => `${indent}  "${k}": ${formatJSON(v, indentLevel + 1)}`);
            return `{\n${entries.join(',\n')}\n${indent}}`;
        }
    } else {
        return JSON.stringify(obj);
    }
}

function generateSectionVariables(element) {
    let result = {};
    let contentNodes = element.querySelectorAll('div#content');
    if (contentNodes) {
        contentNodes.forEach(div => {
            Array.from(div.children).forEach(child => {
                if (child.id) {
                    result[child.id] = getSettingsObject(child);
                }
            });
        });
    }
    return result;
}

function generateActionsVariables(element) {
    let result = {};
    let contentNodes = element.querySelectorAll('div#content');

    if (contentNodes) {
        contentNodes.forEach(div => {
            Array.from(div.children).forEach(child => {
                if (child.id) {
                    const action = getActionsObject(child);
                    if (action && action.actions) { // Only include if actions exist and are not empty
                        result[child.id] = action;
                    }
                }
            });
        });
    }

    // Return result only if it has keys
    return Object.keys(result).length > 0 ? result : null;
}

function convertStringsToNumbers(arr) {
    return arr.map(item => {
        if (typeof item === 'string') {
            // Try to convert string to number
            const num = Number(item);
            // Check if conversion is successful and not NaN
            if (!isNaN(num)) {
                return num;
            }
        }
        // Otherwise return original item
        return item;
    });
}

function getActionsObject(el) {
    let result = {};
    const actions = el.getAttribute('data-actions');
    if (actions) {
        result["actions"] = actions;
    }
    return result;
}

function getSettingsObject(el) {
    let result = {
        value: "",
        min_value: "",
        max_value: ""
    };

    childType = el.getAttribute('data-type');
    if (childType) {

        if (childType === "1") {
            let min = el.getAttribute('data-min');
            let max = el.getAttribute('data-max');
            if (min) {
                if (max) {
                    min = Number(min);
                    max = Number(max);
                    let value = Math.round(Math.random() * (max - min) + min);
                    result = {
                        value: value,
                        min_value: min,
                        max_value: max
                    };
                }
            }
        }
        if (childType === "2") {
            let values = el.getAttribute('data-values');
            if (!values) {
                values = [0, 1];
            } else {
                values = values.split(",").map(s => s.trim());
                values = convertStringsToNumbers(values);
            }
            let value = values[Math.floor(Math.random() * values.length)];
            result = {
                value: value,
                values: values
            };
        }
    }
    const actions = el.getAttribute('data-actions');
    if (actions) {
        result["actions"] = actions;
    }
    return result;
}


function selectTextAndCopy(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;
    const range = document.createRange();
    range.selectNodeContents(element);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    try {
        document.execCommand('copy');
    } catch (err) {
        alert('Failed to copy text.');
    }
    selection.removeAllRanges();
}

function generateLeakWidget(id) {

let htmlFragment = 
`<div class="card text-white bg-success mb-3" style="max-width: 20rem;">
  <div class="card-header">Master Bathroom</div>
  <div class="card-body">
    <h5 class="card-title">No Leaks</h5>
    <ul class="list-group list-group-flush">
      <li class="list-group-item bg-transparent text-white d-flex justify-content-between">
        <span>Temperature:</span> <span>22.4</span>
      </li>
      <li class="list-group-item bg-transparent text-white d-flex justify-content-between">
        <span>Humidity:</span> <span>55%</span>
      </li>
      <li class="list-group-item bg-transparent text-white d-flex justify-content-between">
        <span>Battery:</span>
        <span class="d-flex align-items-center">
          <span style="display: inline-block; width: 30px; height: 8px; border: 1px solid #fff; margin-right: 5px;">
            <span style="display: block; height: 100%; width: 81%; background-color: #00bfff;"></span>
          </span>
          <span>81%</span>
        </span>
      </li>
    </ul>
  </div>
</div>`;

document.getElementById(id).innerHTML = htmlFragment;

}
