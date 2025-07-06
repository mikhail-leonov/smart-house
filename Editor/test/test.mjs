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

    it('Edit home root check - html', async () => {
        await checkUrl('http://edit.jarvis.home:8084/index.html', 'GET');
    });

    it('Rnd home root check - js', async () => {
        await checkUrl('http://edit.jarvis.home:8084/script.js', 'GET');
    });
    
    it('Rnd home root check - bootstrap', async () => {
        await checkUrl('http://edit.jarvis.home:8084/shared/bootstrap.bundle.min.js', 'GET');
    });

});

