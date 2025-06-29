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

describe('getPoolData', () => {
    let clock;

    afterEach(() => {
        if (clock) clock.restore();
    });

    it('should return action = 1 at 10:00', () => {
        const fakeTime = new Date(2025, 0, 1, 10, 0); // Jan 1, 2025, 10:00
        clock = sinon.useFakeTimers(fakeTime.getTime());
        const result = lib.getPoolData();
        expect(result).to.deep.equal([{ action: 1 }]);
    });

    it('should return action = 1 at 17:00', () => {
        const fakeTime = new Date(2025, 0, 1, 17, 0);
        clock = sinon.useFakeTimers(fakeTime.getTime());
        const result = lib.getPoolData();
        expect(result).to.deep.equal([{ action: 1 }]);
    });

    it('should return action = 0 at 09:59', () => {
        const fakeTime = new Date(2025, 0, 1, 9, 59);
        clock = sinon.useFakeTimers(fakeTime.getTime());
        const result = lib.getPoolData();
        expect(result).to.deep.equal([{ action: 0 }]);
    });

    it('should return action = 0 at 10:01', () => {
        const fakeTime = new Date(2025, 0, 1, 10, 1);
        clock = sinon.useFakeTimers(fakeTime.getTime());
        const result = lib.getPoolData();
        expect(result).to.deep.equal([{ action: 0 }]);
    });

    it('should return action = 0 at 17:01', () => {
        const fakeTime = new Date(2025, 0, 1, 17, 1);
        clock = sinon.useFakeTimers(fakeTime.getTime());
        const result = lib.getPoolData();
        expect(result).to.deep.equal([{ action: 0 }]);
    });
});
