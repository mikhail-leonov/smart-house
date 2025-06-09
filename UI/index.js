/**
 * SmartHub - AI powered Smart Home
 * Browser click on room handler
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.6.9
 * @license MIT
 */

function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
    });
    document.getElementById(sectionId).style.display = 'block';
}
function entryClicked(roomDiv) {
    const titleElem = document.getElementById("dataModalLabel");

    const l = roomDiv.getAttribute('data-location');
    const f = roomDiv.getAttribute('data-floor');
    const r = roomDiv.getAttribute('data-room');
    titleElem.innerText = `home/${l}/${f}/${r}`;

    const contentDiv = roomDiv.querySelector('.content');
    const modalElement = document.getElementById('dataModal');
    const modalContent = document.getElementById('modalContent');

    if (!contentDiv) {
        titleElem.innerText = "No content found!";
        modalContent.innerHTML = "<p>No data available</p>";
        return;
    }

    // Clear modal content BEFORE showing
    modalContent.innerHTML = "";

    // Show modal (this removes aria-hidden="true")
    const modal = new bootstrap.Modal(modalElement);
    modal.show();

    // Delay content injection until after modal is fully shown
    setTimeout(() => {
        modalContent.innerHTML = contentDiv.innerHTML;
    }, 10); // small delay to allow DOM to clean up aria attributes
}

class Store {
	constructor(initial = {}) {
        this.data = { ...initial };
        this.subscribers = {};
    }
	subscribe(prop, callback) {
        if (!this.subscribers[prop]) {
			this.subscribers[prop] = new Set();
        }
        this.subscribers[prop].add(callback);
        callback(this.data[prop]);
    }
	set(prop, value) {
        this.data[prop] = value;
        if (this.subscribers[prop]) {
			for (let cb of this.subscribers[prop]) {
				cb(value);
			}
        }
    }
	get(prop) {
		return this.data[prop];
	}
}

const store = new Store({ status: "Connecting..." });

// Bind HTML elements to store properties
document.querySelectorAll('[data-bind]').forEach(el => {
  const prop = el.getAttribute('data-bind');
  store.subscribe(prop, value => {
	el.textContent = value ?? '';
  });
});

// --- MQTT Setup ---
const client = mqtt.connect('ws://mqtt.jarvis.home:9001');

client.on('connect', () => {
	console.log("MQTT connected");
	store.set("status", "Connected");
	client.subscribe('#');
});

client.on('close', () => {
	store.set("status", "Disconnected");
});

client.on('error', err => {
	console.error("MQTT Error:", err);
	store.set("status", "Error");
});

client.on('message', (topic, message) => {
	let value = message.toString();
	try {
		const parsed = JSON.parse(value);
		if (typeof parsed === 'object' && parsed !== null && 'value' in parsed) {
			value = parsed.value;
		} else {
			value = parsed;
		}
	} catch (e) {
		// Leave value as-is if not JSON
	}
	store.set(topic, value);
});

// Update current time
function updateTime() {
	const now = new Date(); const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };  document.getElementById('current-time').textContent = now.toLocaleDateString('en-US', options);
}

// Update time every second
updateTime();
setInterval(updateTime, 1000);
showSection('map');
