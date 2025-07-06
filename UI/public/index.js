/**
 * SmartHub - AI powered Smart Home
 * Browser click on room handler
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.7.4
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
    const modalContent = document.getElementById('modalContent');

    if (!contentDiv) {
        titleElem.innerText = "No content found!";
        modalContent.innerHTML = "<p>No data available</p>";
        return;
    }

    // Clear modal content BEFORE showing
    modalContent.innerHTML = contentDiv.innerHTML;

	const modal = new bootstrap.Modal(document.getElementById('dataModal'));
	modal.show();
	
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
	dump() {
		let result = [];
		for (const [key, value] of Object.entries(this.data)) {
			result.push(key + ' = ' + value);
		}
		return result;
	}
}

const store = new Store({ });

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
	client.subscribe('#', (err, granted) => {
		if (err) {
			console.error('Subscription failed:', err);
		} else {
			console.log('Subscribed to topics:', granted);
		}
	});	
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


// Leak Card code
document.addEventListener('DOMContentLoaded', () => {
	document.querySelectorAll('.leak-card').forEach(card => {
		const leakEl = card.querySelector('[data-bind$="/water_leak"]');
		const batteryEl = card.querySelector('[data-bind$="/water_leak_sensor_battery"]');
		if (!leakEl || !batteryEl) { return; }
		const leakRaw = (leakEl.textContent || '').trim().toLowerCase();
		const leakDetected = ['true', '1', 'yes', 'on', 'leak'].includes(leakRaw);
		const batteryRaw = parseInt((batteryEl.textContent || '0').trim());
		const batteryLevel = isNaN(batteryRaw) ? 0 : batteryRaw;
			
		// --- Leak styling ---
		leakEl.classList.remove('bg-success', 'bg-danger');
		if (leakDetected) {
			leakEl.classList.add('badge', 'bg-danger');
			leakEl.textContent = 'Leak!';
			card.style.border = '2px solid red';
			card.style.backgroundColor = '#ffe5e5';
		} else {
			leakEl.classList.add('badge', 'bg-success');
			leakEl.textContent = 'Dry';
		}
		// --- Battery styling ---
		batteryEl.classList.remove('bg-success', 'bg-warning', 'bg-danger', 'text-dark');
		if (batteryLevel < 20) {
			batteryEl.classList.add('badge', 'bg-danger');
			batteryEl.textContent = batteryLevel + '% ??';
		} else if (batteryLevel < 50) {
			batteryEl.classList.add('badge', 'bg-warning', 'text-dark');
			batteryEl.textContent = batteryLevel + '%';
		} else {
			batteryEl.classList.add('badge', 'bg-success');
			batteryEl.textContent = batteryLevel + '%';
		}
	});
});

function loadLog() {
	try {
		let text = "";
		const mqtts = store.dump();	
		mqtts.forEach(element => {
			text += element + "\n";
		});
		document.getElementById('logContent').textContent = text;
	} catch (e) {
		document.getElementById('logContent').textContent = 'Error loading log: ' + e.message;
	}
}

// Update current time
function updateTime() {
	const now = new Date(); const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };  document.getElementById('current-time').textContent = now.toLocaleDateString('en-US', options);
}

// Update time every second
updateTime();
setInterval(updateTime, 1000);
showSection('state');



