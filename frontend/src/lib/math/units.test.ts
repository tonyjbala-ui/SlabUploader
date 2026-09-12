import { describe, expect, it } from 'vitest';
import {
	roundBdft,
	roundHalfUp,
	roundLengthToEighth,
	roundPrice,
	roundTo2Decimals
} from './units.js';

describe('TV-10 Rounding', () => {
	it('length 96.04" → 96" (nearest 1/8")', () => {
		const out = roundLengthToEighth(96.04);
		console.log('TV-10 fixture length:', { input: 96.04, rounded: out });
		expect(out).toBe(96);
	});

	it('sqft 0.641 → 0.64', () => {
		const out = roundTo2Decimals(0.641);
		console.log('TV-10 fixture sqft:', { input: 0.641, rounded: out });
		expect(out).toBe(0.64);
	});

	it('bdft 11.525 → 11.53 (half-up)', () => {
		const out = roundBdft(11.525);
		console.log('TV-10 fixture bdft:', { input: 11.525, rounded: out });
		expect(out).toBe(11.53);
	});

	it('price 12.345 → 12.35 (half-up)', () => {
		const out = roundPrice(12.345);
		console.log('TV-10 fixture price:', { input: 12.345, rounded: out });
		expect(out).toBe(12.35);
	});

	it('other eighth steps', () => {
		// Midpoint between 96 and 96.125 is 96.0625
		expect(roundLengthToEighth(96.06)).toBe(96);
		expect(roundLengthToEighth(96.07)).toBe(96.125);
		expect(roundLengthToEighth(10.0)).toBe(10);
		// Midpoint between 10 and 10.125 is 10.0625 — half-up → 10.125
		expect(roundLengthToEighth(10.0625)).toBe(10.125);
		expect(roundLengthToEighth(10.07)).toBe(10.125);
	});

	it('roundHalfUp midpoints', () => {
		expect(roundHalfUp(1.005, 2)).toBe(1.01);
		expect(roundHalfUp(2.5, 0)).toBe(3);
	});
});
