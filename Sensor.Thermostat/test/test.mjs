/**
 * SmartHub - Gmail-to-MQTT Notification (Async MQTT)
 * Test suite for Web working status EMULATOR send MQTT notice asynchronously
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.7.4
 * @license MIT
 */

import { expect } from 'chai';
import sinon from 'sinon';
import proxyquire from 'proxyquire';

describe('Thermostat Data Functions', () => {
    let sandbox, commonStub, thermostatDataModule;

    beforeEach(() => {
        sandbox = sinon.createSandbox();

        // Common stub can be adjusted if you have any dependencies there, but for now, it's unused
        commonStub = {};

        // Proxyquire will inject the real implementation of the thermostat module
        thermostatDataModule = proxyquire('../lib/thermostat', {
            '../Shared/common-node': commonStub, // Pass in any required stubs if necessary
        });
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should return correct temperature based on the time of day', () => {
        const nowStub = sandbox.stub(Date, 'now');
        nowStub.returns(new Date('2025-07-06T12:00:00Z').getTime()); // Mock 12 PM time

        const result = thermostatDataModule.getThermostatData();
        expect(result).to.be.an('array').with.lengthOf(1);
        expect(result[0].temperature).to.equal(76); // It should be 76 between 8 AM and 10 PM
    });

    it('should return lower temperature outside the daytime range', () => {
        const nowStub = sandbox.stub(Date, 'now');
        nowStub.returns(new Date('2025-07-06T23:00:00Z').getTime()); // Mock 11 PM time

        const result = thermostatDataModule.getThermostatData();
        expect(result).to.be.an('array').with.lengthOf(1);
        expect(result[0].temperature).to.equal(74); // It should be 74 after 10 PM
    });

    it('should return 74 for early morning (before 8 AM)', () => {
        const nowStub = sandbox.stub(Date, 'now');
        nowStub.returns(new Date('2025-07-06T05:00:00Z').getTime()); // Mock 5 AM time

        const result = thermostatDataModule.getThermostatData();
        expect(result).to.be.an('array').with.lengthOf(1);
        expect(result[0].temperature).to.equal(74); // It should be 74 before 8 AM
    });

    it('should return 76 for late afternoon (before 10 PM)', () => {
        const nowStub = sandbox.stub(Date, 'now');
        nowStub.returns(new Date('2025-07-06T17:00:00Z').getTime()); // Mock 5 PM time

        const result = thermostatDataModule.getThermostatData();
        expect(result).to.be.an('array').with.lengthOf(1);
        expect(result[0].temperature).to.equal(76); // It should be 76 between 8 AM and 10 PM
    });
});

