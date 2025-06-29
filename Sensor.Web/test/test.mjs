/**
 * SmartHub - Gmail-to-MQTT Notification (Async MQTT)
 * Test suite for Web working status EMULATOR send MQTT notice asynchronously
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.7.3
 * @license MIT
 */

import { expect } from 'chai';
import sinon from 'sinon';
import lib from '../lib.js'; 
import proxyquire from 'proxyquire';

describe('Environmental Data Functions', () => {
	let sandbox, requestStub, commonStub, locationStub, constantsStub, env;

	const fakeData = (key, value = 123) => ({
		hourly: {
			time: [
				new Date(Date.now() - 3600000).toISOString(), // past
				new Date(Date.now() + 3600000).toISOString(), // future
			],
			[key]: [null, value],
		}
	});

	beforeEach(() => {
		sandbox = sinon.createSandbox();

		requestStub = sandbox.stub().returns({
			getBody: () => JSON.stringify(fakeData('temperature_2m', 22.5))
		});

		commonStub = {
			constructURL: sandbox.stub().returns("http://mock-url"),
			getWeatherDescription: sandbox.stub().returns("Sunny"),
			getVisibilityDescription: sandbox.stub().returns("Good"),
			getWindDirection: sandbox.stub().returns("North")
		};

		locationStub = { LAT: 0, LON: 0, OCEAN_LAT: 1, OCEAN_LON: 1 };
		constantsStub = { TIMEZONE: "UTC" };

		env = proxyquire('../lib/weather', {
			'sync-request': requestStub,
			'../Shared/location': locationStub,
			'../Shared/constants': constantsStub,
			'../Shared/common-node': commonStub
		});
	});

	afterEach(() => {
		sandbox.restore();
	});

	it('getWeatherData returns parsed and mapped data', () => {
		const result = env.getWeatherData();
		expect(result).to.be.an('array').with.lengthOf(1);
		const data = result[0];
		expect(data.temperature_2m).to.equal(22.5);
		expect(data.weather_code).to.equal("Sunny");
		expect(data.visibility).to.equal("Good");
		expect(data.wind_direction_10m).to.equal("North");
	});

	it('getOceanData returns correct structure', () => {
		// override with ocean key
		requestStub.returns({
			getBody: () => JSON.stringify(fakeData('wave_height', 3.14))
		});
		const result = env.getOceanData();
		expect(result).to.deep.equal([{ wave_height: 3.14 }]);
	});

	it('getAirData returns correct structure', () => {
		requestStub.returns({
			getBody: () => JSON.stringify(fakeData('pm2_5', 44.4))
		});
		const result = env.getAirData();
		expect(result).to.deep.equal([{ pm2_5: 44.4 }]);
	});
});


