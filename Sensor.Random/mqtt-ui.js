/**
 * SmartHub - AI powered Smart Home
 * Browser mqtt client
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.6.9
 * @license MIT
 */

/**
 * MQTT UI Controller for Smart Home Simulator
 * Handles configuration loading, dropdown management, and simulation controls
 */

class MQTTSimulatorUI {
    constructor() {
        this.config = null;
        this.simulationInterval = null;
        this.isSimulating = false;
        this.selectedFilters = {
            locationType: null,
            floor: null,
            room: null,
            variable: null
        };
        
        this.init();
    }

    init() {
        // Bind event listeners
        this.bindEventListeners();
        
        // Initialize UI state
        this.updateConnectionStatus(false);
        this.log('MQTT Simulator initialized');
    }

    bindEventListeners() {
        // Configuration file upload
        document.getElementById('configFile').addEventListener('change', (e) => {
            this.handleConfigUpload(e);
        });

        // Dropdown change handlers
        document.getElementById('locationType').addEventListener('change', (e) => {
            this.handleLocationTypeChange(e.target.value);
        });

        document.getElementById('floor').addEventListener('change', (e) => {
            this.handleFloorChange(e.target.value);
        });

        document.getElementById('room').addEventListener('change', (e) => {
            this.handleRoomChange(e.target.value);
        });

        document.getElementById('variable').addEventListener('change', (e) => {
            this.handleVariableChange(e.target.value);
        });

        // Random value button
        document.getElementById('randomValueBtn').addEventListener('click', () => {
            this.generateRandomValue();
        });

        // Control buttons
        document.getElementById('startRandomBtn').addEventListener('click', () => {
            this.startRandomSimulation();
        });

        document.getElementById('stopRandomBtn').addEventListener('click', () => {
            this.stopSimulation();
        });

        document.getElementById('sendSingleRandomBtn').addEventListener('click', () => {
            this.sendSingleRandomMessage();
        });

        // Clear log button
        document.getElementById('clearLogBtn').addEventListener('click', () => {
            this.clearLog();
        });
    }

    async handleConfigUpload(event) {
        const file = event.target.files[0];
        if (!file) { return; }
        try {
            const text = await file.text();
            this.config = JSON.parse(text);
            this.populateDropdowns();
            this.log(`Configuration loaded: ${file.name}`);
        } catch (error) {
            this.log(`Error loading configuration: ${error.message}`, 'error');
        }
    }

    populateDropdowns() {
	
		// Convert your config object to array
		const configArray = flattenConfig(this.config);

		// Extract unique values for each dropdown level
		const locationTypes = [...new Set(configArray.map(item => item.locationType).filter(Boolean))];
		const floors = [...new Set(configArray.map(item => item.floor).filter(Boolean))];
		const rooms = [...new Set(configArray.map(item => item.room).filter(Boolean))];
		const variables = [...new Set(configArray.map(item => item.variable).filter(Boolean))];

		// Populate dropdowns with error handling
		try {
			this.populateSelect('locationType', locationTypes, 'All Location Types');
			this.populateSelect('floor', floors, 'All Floors');
			this.populateSelect('room', rooms, 'All Rooms');
			this.populateSelect('variable', variables, 'All Variables');
			
			// Enable dropdowns
			this.enableDropdowns();
		} catch (error) {
			console.error('Error populating dropdowns:', error);
		}

    }

    populateSelect(selectId, options, defaultText) {
        const select = document.getElementById(selectId);
        select.innerHTML = `<option value="">${defaultText}</option>`;
        
        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;
            select.appendChild(optionElement);
        });

        select.disabled = false;
    }

    enableDropdowns() {
        ['locationType', 'floor', 'room', 'variable'].forEach(id => {
            document.getElementById(id).disabled = false;
        });
    }

    handleLocationTypeChange(value) {
        this.selectedFilters.locationType = value || null;
        this.updateDependentDropdowns();
        this.updateVariableDescription();
    }

    handleFloorChange(value) {
        this.selectedFilters.floor = value || null;
        this.updateDependentDropdowns();
        this.updateVariableDescription();
    }

    handleRoomChange(value) {
        this.selectedFilters.room = value || null;
        this.updateDependentDropdowns();
        this.updateVariableDescription();
    }

    handleVariableChange(value) {
        this.selectedFilters.variable = value || null;
        this.updateVariableDescription();
        this.showValueContainer();
    }

    updateDependentDropdowns() {
        // Filter config based on current selections
        let filteredConfig = this.config;

        if (this.selectedFilters.locationType) {
            filteredConfig = filteredConfig.filter(item => 
                item.locationType === this.selectedFilters.locationType);
        }

        if (this.selectedFilters.floor) {
            filteredConfig = filteredConfig.filter(item => 
                item.floor === this.selectedFilters.floor);
        }

        if (this.selectedFilters.room) {
            filteredConfig = filteredConfig.filter(item => 
                item.room === this.selectedFilters.room);
        }

        // Update variable dropdown based on filtered results
        const availableVariables = [...new Set(filteredConfig.map(item => item.variable))];
        this.populateSelect('variable', availableVariables, 'All Variables');
    }

    updateVariableDescription() {
        const descriptionDiv = document.getElementById('variableDescription');
        
        if (this.selectedFilters.variable) {
            const variableConfig = this.getFilteredConfig().find(item => 
                item.variable === this.selectedFilters.variable);
            
            if (variableConfig) {
                descriptionDiv.innerHTML = `
                    <strong>${variableConfig.variable}</strong><br>
                    <small>Type: ${variableConfig.type}</small><br>
                    <small>Range: ${variableConfig.min} - ${variableConfig.max}</small><br>
                    <small>Unit: ${variableConfig.unit || 'N/A'}</small>
                `;
            }
        } else {
            descriptionDiv.textContent = 'Select a variable to see its description and valid values';
        }
    }

    showValueContainer() {
        if (this.selectedFilters.variable) {
            document.getElementById('valueContainer').style.display = 'block';
        } else {
            document.getElementById('valueContainer').style.display = 'none';
        }
    }

    generateRandomValue() {
        if (!this.selectedFilters.variable) {
            this.log('Please select a variable first', 'warning');
            return;
        }

        const variableConfig = this.getFilteredConfig().find(item => 
            item.variable === this.selectedFilters.variable);
        
        if (variableConfig) {
            const randomValue = this.generateRandomValueForConfig(variableConfig);
            document.getElementById('value').value = randomValue;
        }
    }

    generateRandomValueForConfig(config) {
        const min = parseFloat(config.min);
        const max = parseFloat(config.max);
        
        if (config.type === 'boolean') {
            return Math.random() > 0.5 ? 'true' : 'false';
        } else if (config.type === 'integer') {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        } else if (config.type === 'float') {
            return (Math.random() * (max - min) + min).toFixed(2);
        }
        
        return Math.random() * (max - min) + min;
    }

    getFilteredConfig() {
        if (!this.config) return [];

        return this.config.filter(item => {
            return (!this.selectedFilters.locationType || item.locationType === this.selectedFilters.locationType) &&
                   (!this.selectedFilters.floor || item.floor === this.selectedFilters.floor) &&
                   (!this.selectedFilters.room || item.room === this.selectedFilters.room) &&
                   (!this.selectedFilters.variable || item.variable === this.selectedFilters.variable);
        });
    }

    startRandomSimulation() {
        if (!this.config) {
            this.log('Please load a configuration file first', 'error');
            return;
        }

        if (this.isSimulating) {
            this.log('Simulation is already running', 'warning');
            return;
        }

        this.isSimulating = true;
        this.updateControlButtons();
        this.updateConnectionStatus(true);
        
        const interval = parseInt(document.getElementById('interval').value) * 1000;
        const randomness = parseInt(document.getElementById('randomness').value) * 1000;
        const useRandomInterval = document.getElementById('randomInterval').checked;

        this.log('Started random simulation');

        const sendMessage = () => {
            this.sendRandomMessage();
            
            if (this.isSimulating) {
                const nextInterval = useRandomInterval ? 
                    interval + (Math.random() * randomness * 2 - randomness) : 
                    interval;
                
                this.simulationInterval = setTimeout(sendMessage, Math.max(1000, nextInterval));
            }
        };

        sendMessage();
    }

    stopSimulation() {
        if (this.simulationInterval) {
            clearTimeout(this.simulationInterval);
            this.simulationInterval = null;
        }
        
        this.isSimulating = false;
        this.updateControlButtons();
        this.updateConnectionStatus(false);
        this.log('Stopped simulation');
    }

    sendSingleRandomMessage() {
        if (!this.config) {
            this.log('Please load a configuration file first', 'error');
            return;
        }

        this.sendRandomMessage();
    }

    sendRandomMessage() {
        const filteredConfig = this.getFilteredConfig();
        
        if (filteredConfig.length === 0) {
            this.log('No matching configuration found for current filters', 'warning');
            return;
        }

        // Select random item from filtered config
        const randomConfig = filteredConfig[Math.floor(Math.random() * filteredConfig.length)];
        const randomValue = this.generateRandomValueForConfig(randomConfig);
        
        // Create MQTT topic
        const topic = `${randomConfig.locationType}/${randomConfig.floor}/${randomConfig.room}/${randomConfig.variable}`;
        
        // Create message payload
        const payload = {
            value: randomValue,
            unit: randomConfig.unit || '',
            timestamp: new Date().toISOString(),
            type: randomConfig.type
        };

        // Send message (this would integrate with your MQTT core)
        this.publishMessage(topic, payload);
        
        const logEachMessage = document.getElementById('logEachMessage').checked;
        if (logEachMessage) {
            this.log(`Sent: ${topic} = ${randomValue} ${randomConfig.unit || ''}`, 'success');
        }
    }

    publishMessage(topic, payload) {
        // This method should integrate with your MQTT core functionality
        // For now, we'll just simulate the message sending
        console.log('Publishing to MQTT:', { topic, payload });
        
        // If you have a global MQTT client, you would use it here:
        // if (window.mqttClient && window.mqttClient.connected) {
        //     window.mqttClient.publish(topic, JSON.stringify(payload));
        // }
    }

    updateControlButtons() {
        document.getElementById('startRandomBtn').disabled = this.isSimulating;
        document.getElementById('stopRandomBtn').disabled = !this.isSimulating;
    }

    updateConnectionStatus(connected) {
        const statusIndicator = document.getElementById('connectionStatus');
        const statusText = document.getElementById('connectionStatusText');
        
        if (connected) {
            statusIndicator.className = 'status-indicator status-online';
            statusText.textContent = 'Simulating';
        } else {
            statusIndicator.className = 'status-indicator status-offline';
            statusText.textContent = 'Disconnected';
        }
    }

    log(message, type = 'info') {
        const logDiv = document.getElementById('log');
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        
        let className = 'log-entry';
        if (type === 'error') className += ' log-error';
        else if (type === 'warning') className += ' log-warning';
        else if (type === 'success') className += ' log-success';
        
        logEntry.className = className;
        logEntry.innerHTML = `<span class="log-timestamp">[${timestamp}]</span> ${message}`;
        
        logDiv.appendChild(logEntry);
        logDiv.scrollTop = logDiv.scrollHeight;
    }

    clearLog() {
        document.getElementById('log').innerHTML = '';
    }
}

// Initialize the simulator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.mqttSimulator = new MQTTSimulatorUI();
});

// Export for potential external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MQTTSimulatorUI;
}