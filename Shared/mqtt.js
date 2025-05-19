        const mqttBrokerInput = "ws://localhost:9001";
        const mqttTopicInput = "home";
        let mqttClient = null;

        const connectionStatus = document.getElementById('connectionStatus');
        const connectionStatusText = document.getElementById('connectionStatusText');

        // Connect to MQTT broker
        async function connectToMqtt() {
            if (mqttClient && mqttClient.connected) {
                return true;
            }
            
            const brokerUrl = mqttBrokerInput;
            if (!brokerUrl) {
                logToConsole('Please enter MQTT broker URL', 'error');
                return false;
            }
            
            updateConnectionStatus('connecting');
            
            try {
                mqttClient = mqtt.connect(brokerUrl);
                
                return new Promise((resolve) => {
                    mqttClient.on('connect', () => {
                        updateConnectionStatus('online');
                        logToConsole('Connected to MQTT broker');
                        resolve(true);
                    });
                    
                    mqttClient.on('error', (err) => {
                        updateConnectionStatus('offline');
                        logToConsole('MQTT connection error: ' + err.message, 'error');
                        resolve(false);
                    });
                    
                    mqttClient.on('close', () => {
                        updateConnectionStatus('offline');
                        logToConsole('Disconnected from MQTT broker');
                    });
                });
            } catch (error) {
                updateConnectionStatus('offline');
                logToConsole('MQTT connection error: ' + error.message, 'error');
                return false;
            }
        }
        
        // Update connection status indicator
        function updateConnectionStatus(status) {
            if (connectionStatus) {
              connectionStatus.className = 'status-indicator';
            
              switch (status) {
                case 'online':
                    connectionStatus.classList.add('status-online');
                    connectionStatusText.textContent = 'Connected';
                    break;
                case 'connecting':
                    connectionStatus.classList.add('status-connecting');
                    connectionStatusText.textContent = 'Connecting...';
                    break;
                case 'offline':
                    connectionStatus.classList.add('status-offline');
                    connectionStatusText.textContent = 'Disconnected';
                    break;
              }
           }
        }
