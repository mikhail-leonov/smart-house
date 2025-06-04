/**
 * SmartHub Jarvis - AI powered Smart Home
 * Location Library Core (for Browser & Node.js)
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.6.8
 * @license MIT
 */

const LAT = +26.2700;
const LON = -80.2700;

const OCEAN_LAT = 26.291471;
const OCEAN_LON = -80.073096;

const locationContent = { 
    LAT, 
    LON, 
    OCEAN_LAT, 
    OCEAN_LON 
};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = locationContent;
} else {
    window.Jarvis = window.Jarvis || {};
    window.Jarvis.location = locationContent;
}
