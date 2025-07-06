/**
 * SmartHub - Test 
 * Online URL Tests
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.7.4
 * @license MIT
 */

import { expect } from 'chai';
import fetch from 'node-fetch';

describe('Online URL Checks', function () {
    this.timeout(5000); // Just in case one is slow

    async function checkUrl(url, method) {
        const response = await fetch(url, { method });
        expect(response.ok, `URL failed: ${url} with status ${response.status}`).to.be.true;
    }

    it('Rnd home root check - html', async () => {
        await checkUrl('http://rnd.jarvis.home:8081/index.html', 'GET');
    });

    it('Rnd home root check - js', async () => {
        await checkUrl('http://rnd.jarvis.home:8081/index.js', 'GET');
    });
    
    it('Rnd home root check - bootstrap', async () => {
        await checkUrl('http://rnd.jarvis.home:8081/shared/bootstrap.bundle.min.js', 'GET');
    });

    it('Rnd home root check - cache', async () => {
        await checkUrl('http://rnd.jarvis.home:8081/shared/cache-core.js', 'GET');
    });
    
    it('Rnd home root check - constants', async () => {
        await checkUrl('http://rnd.jarvis.home:8081/shared/constants.js', 'GET');
    });
    
    it('Rnd home root check - log', async () => {
        await checkUrl('http://rnd.jarvis.home:8081/shared/log-core.js', 'GET');
    });
    
    it('Rnd home root check - mqtt core', async () => {
        await checkUrl('http://rnd.jarvis.home:8081/shared/mqtt-core.js', 'GET');
    });
    
    it('Rnd home root check - mqtt min', async () => {
        await checkUrl('http://rnd.jarvis.home:8081/shared/mqtt.min.js', 'GET');
    });
   
    it('Rnd home root check - sensor', async () => {
        await checkUrl('http://rnd.jarvis.home:8081/shared/sensor-core.js', 'GET');
    });
   
    it('Rnd home root check - web', async () => {
        await checkUrl('http://rnd.jarvis.home:8081/shared/web-core.js', 'GET');
    });
   
});

