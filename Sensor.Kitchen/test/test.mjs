/**
 * SmartHub - Gmail-to-MQTT Notification (Async MQTT)
 * Test suiote for Pools working status EMULATOR send MQTT notice asynchronously
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.7.3
 * @license MIT
 */

import { expect } from 'chai';
import sinon from 'sinon';
import lib from '../lib.js'; 

describe('getKitchenData', () => {
    let clock;

    afterEach(() => {
        if (clock) clock.restore();
    });

    it('should set water_filter = 1 on Jan 1', () => {
        const fakeTime = new Date(2025, 0, 1); // Jan = 0
        clock = sinon.useFakeTimers(fakeTime.getTime());
        const result = lib.getKitchenData();
        expect(result).to.deep.equal([{ water_filter: 1, frige_filter: 0 }]);
    });

    it('should set frige_filter = 1 on Jun 1', () => {
        const fakeTime = new Date(2025, 5, 1); // Jun = 5
        clock = sinon.useFakeTimers(fakeTime.getTime());
        const result = lib.getKitchenData();
        expect(result).to.deep.equal([{ water_filter: 0, frige_filter: 1 }]);
    });

    it('should set both = 0 on a normal day', () => {
        const fakeTime = new Date(2025, 4, 15); // May 15
        clock = sinon.useFakeTimers(fakeTime.getTime());
        const result = lib.getKitchenData();
        expect(result).to.deep.equal([{ water_filter: 0, frige_filter: 0 }]);
    });

    it('should set both = 1 on Jun 1', () => {
        const fakeTime = new Date(2025, 5, 1); // Jun = 5
        clock = sinon.useFakeTimers(fakeTime.getTime());
        const result = lib.getKitchenData();
        expect(result).to.deep.equal([{ water_filter: 1, frige_filter: 1 }]);
    });
});

