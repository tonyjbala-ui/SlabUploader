import { describe, expect, it } from 'vitest';
import {
	AREA_DECIMALS,
	ASPECT_H,
	ASPECT_W,
	BDFT_DECIMALS,
	FILL_TARGET,
	INCH_STEP,
	OUTPUT_PX_MIN,
	PRICE_DECIMALS,
	WIDTH_SAMPLE_IN
} from './constants.js';

describe('constants §7.1', () => {
	it('locks TECH-SPEC code constants', () => {
		expect(FILL_TARGET).toBe(0.8);
		expect(ASPECT_W).toBe(3);
		expect(ASPECT_H).toBe(4);
		expect(OUTPUT_PX_MIN).toBe(1600);
		expect(WIDTH_SAMPLE_IN).toBe(6);
		expect(INCH_STEP).toBe(0.125);
		expect(AREA_DECIMALS).toBe(2);
		expect(BDFT_DECIMALS).toBe(2);
		expect(PRICE_DECIMALS).toBe(2);
	});
});
