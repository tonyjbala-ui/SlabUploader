import { describe, expect, it } from 'vitest';
import { computeBdft, computeScale, computeSqft } from './area.js';

describe('TV-3 Scale, sqft, bdft', () => {
	it('bdft = sqft × thickness; 0.64 × 1.5 = 0.96 (no /12)', () => {
		const sqft = 0.64;
		const thickness = 1.5;
		const bdft = computeBdft(sqft, thickness);
		console.log('TV-3 fixture:', {
			lengthIn: 96,
			thicknessIn: thickness,
			sqft,
			bdft,
			identity_1sqft_1in: computeBdft(1, 1),
			note: 'bdft = sqft * thickness_in; NEVER /12'
		});
		expect(bdft).toBe(0.96);
	});

	it('identity: 1 sqft @ 1" = 1 bdft', () => {
		expect(computeBdft(1, 1)).toBe(1);
		expect(computeBdft(1, 1)).not.toBeCloseTo(1 / 12, 5);
	});

	it('never divides by 12 even for larger values', () => {
		// Classic lumber mistake would yield sqft*thickness/12
		const sqft = 10;
		const thickness = 2;
		expect(computeBdft(sqft, thickness)).toBe(20);
		expect(computeBdft(sqft, thickness)).not.toBeCloseTo(20 / 12, 5);
	});

	it('sqft from mask_pixel_count / scale^2 / 144', () => {
		// Construct a scale that yields 0.64 sqft for a known pixel count.
		// sqft = (px / scale^2) / 144 = 0.64 ⇒ px / scale^2 = 0.64 * 144 = 92.16
		const scale = computeScale(960, 96); // 10 px/in
		expect(scale).toBe(10);
		const maskPx = 92.16 * scale * scale; // 9216
		const sqft = computeSqft(maskPx, scale);
		console.log('TV-3 sqft-from-mask fixture:', { scale, maskPx, sqft });
		expect(sqft).toBe(0.64);
		expect(computeBdft(sqft, 1.5)).toBe(0.96);
	});
});
