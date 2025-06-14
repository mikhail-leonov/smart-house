/**
 * SmartHub - AI powered Smart Home
 * Browser click on room handler
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.7.1
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
	
	if (topic.includes('water_leak_sensor_battery')) {
		const el = document.querySelector(`[data-bind="${topic}"]`);
		if (el) {
			const num = parseFloat(value);
			// Remove old battery-* classes
			el.classList.remove('battery-low', 'battery-ok', 'battery-full', 'battery-unknown');
			// Add new class based on value
			if (isNaN(num)) {
				el.classList.add('battery-unknown');
			} else if (num < 30) {
				el.classList.add('battery-low');
			} else if (num < 90) {
				el.classList.add('battery-ok');
			} else {
				el.classList.add('battery-full');
			}
		}
	}
	if (topic.includes('water_leak')) {
		const el = document.querySelector(`[data-bind="${topic}"]`);
		if (el) {
			const detected = value === "true" || value === "1" || value === 1;
			el.classList.toggle('leak-detected', detected);
		}
	}	
	
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



// Update current time
function updateTime() {
	const now = new Date(); const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };  document.getElementById('current-time').textContent = now.toLocaleDateString('en-US', options);
}

// Update time every second
updateTime();
setInterval(updateTime, 1000);
showSection('map');



