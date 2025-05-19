
    let LAT = +26.2700;
    let LON = -80.2700;

    async function getOutsideFront_yardTemperatureValue_Web(lat, lon) {
        let result;
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&temperature_unit=celsius`;
        try {
            const response = await fetch(url);  // Wait for the response
            if (response.ok) {  // Check if the response is valid (status 200)
                const data = await response.json();  // Wait for the data to be parsed
                result = data.current_weather.temperature;  // Extract the temperature
            } else {
                result = null;  // Handle invalid responses
            }
        } catch (error) {
            result = null;  // Handle network errors or other issues
        }
        return result;
    }
    function degreesToDirection(degrees) {
        const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        const index = Math.round(degrees / 45) % 8;
        return directions[index];
    }
    async function getOutsideFront_yardWind_directionValue_Web(lat, lon) {
        let result;
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&temperature_unit=celsius`;
        try {
            const response = await fetch(url);  // Wait for the response
            if (response.ok) {  // Check if the response is valid (status 200)
                const data = await response.json();  // Wait for the data to be parsed
                result = degreesToDirection(data.current_weather.winddirection);  // Extract the Wind direction
            } else {
                result = null;  // Handle invalid responses
            }
        } catch (error) {
            result = null;  // Handle network errors or other issues
        }
        return result;
    }
    async function getOutsideFront_yardWind_speedValue_Web(lat, lon) {
        let result;
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&temperature_unit=celsius`;
        try {
            const response = await fetch(url);  // Wait for the response
            if (response.ok) {  // Check if the response is valid (status 200)
                const data = await response.json();  // Wait for the data to be parsed
                result = data.current_weather.windspeed;  // Extract the Wind speed
            } else {
                result = null;  // Handle invalid responses
            }
        } catch (error) {
            result = null;  // Handle network errors or other issues
        }
        return result;
    }
    async function getOutsideFront_yardHumidityValue_Web(lat, lon) {
        let result = null;
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=relative_humidity_2m&timezone=auto`;
        try {
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                const now = new Date();
                const currentHourISO = now.toISOString().slice(0, 13) + ":00";
    
                const timeIndex = data.hourly.time.indexOf(currentHourISO);
                if (timeIndex !== -1) {
                    result = data.hourly.relative_humidity_2m[timeIndex];
                }
            }
        } catch (error) {

        }
        return result;
    }
    async function getOutsideFront_yardBarometric_pressureValue_Web(lat, lon) {
        let result = null;
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=relative_humidity_2m&timezone=auto`;
        try {
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                const now = new Date();
                const currentHourISO = now.toISOString().slice(0, 13) + ":00";
    
                const timeIndex = data.hourly.time.indexOf(currentHourISO);
                if (timeIndex !== -1) {
                    result = data.hourly.pressure_msl[index]; // Pressure in hPa
                }
            }
        } catch (error) {

        }
        return result;
    }

