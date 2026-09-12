import { describe, expect, it } from 'vitest';
import { summarizeWidths, widthStations } from './widths.js';
import { WIDTH_SAMPLE_IN } from './constants.js';

describe('TV-4 Width samples contract', () => {
	it('stations every 6" on a 96" axis including 0 and 96', () => {
		const stations = widthStations(96);
		expect(WIDTH_SAMPLE_IN).toBe(6);
		expect(stations[0]).toBe(0);
		expect(stations).toContain(6);
		expect(stations).toContain(90);
		expect(stations).toContain(96);
		expect(stations.length).toBe(17); // 0..96 step 6
	});

	it('summarize min/max/avg', () => {
		const samples = [
			{ stationIn: 0, widthIn: 20 },
			{ stationIn: 6, widthIn: 22 },
			{ stationIn: 12, widthIn: 18 }
		];
		const stats = summarizeWidths(samples);
		expect(stats.min).toBe(18);
		expect(stats.max).toBe(22);
		expect(stats.avg).toBe(20);
	});
});
