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

    it('MQTT home root check - html', async () => {
        await checkUrl('http://test.jarvis.home:8082/index.html', 'GET');
    });

    it('MQTT home root check - js', async () => {
        await checkUrl('https://unpkg.com/mqtt/dist/mqtt.min.js', 'GET');
    });

    it('MQTT home root check - bootstrap', async () => {
        await checkUrl('http://test.jarvis.home:8082/shared/bootstrap.bundle.min.js', 'GET');
    });

    it('MQTT home root check - js', async () => {
        await checkUrl('http://test.jarvis.home:8082/index.js', 'GET');
    });
});

