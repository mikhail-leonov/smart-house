        const mqttPath = "#";
        const mqttUrl = "ws://localhost:9001";

        const client = mqtt.connect(mqttUrl);

        client.on('connect', () => {
            client.subscribe(mqttPath);
        });

        client.on('message', (topic, message) => {
            const payload = message.toString();
            const pathParts = topic.split('/');

            // Extract parts for locating the room and sensor:
            // Assuming topic format: "home/inside/first_floor/living-room-1f/temperature" or similar
            const [home, location, floor, room, sensor] = pathParts;

            // Find the matching room div by data attributes
            const roomDiv = document.querySelector( `.room[data-location="${location}"][data-floor="${floor}"][data-room="${room}"]`);

            if (roomDiv) {
              // Inside roomDiv find the sensor div by id
              const sensorDiv = roomDiv.querySelector(`#${sensor}`);
              if (sensorDiv) {
                 const currentValuePayload = sensorDiv.getAttribute('data-value'); 
                 let currentValue = null; if (currentValuePayload) { currentValue = JSON.parse(currentValuePayload).value; }
                 let newValue = JSON.parse(payload).value; 

                 sensorDiv.setAttribute('data-value', payload );
               
                 if (newValue !== currentValue) {
                     roomDiv.classList.add('room-flash');
                     setTimeout(() => { 
                         roomDiv.classList.remove('room-flash');
                     }, 1000); 
                 }
            }
          }
          });
