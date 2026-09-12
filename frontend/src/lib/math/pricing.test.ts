import { describe, expect, it } from 'vitest';
import { recommendPrice, storePrice } from './pricing.js';

describe('TV-8 Pricing', () => {
	it('bdft 0.96 × $12.50 → rec 12.00', () => {
		const rec = recommendPrice(0.96, 12.5);
		console.log('TV-8 fixture rec:', { bdft: 0.96, pricePerBdft: 12.5, rec });
		expect(rec).toBe(12.0);
	});

	it('override 150.00 stored as 150.00', () => {
		expect(storePrice(150)).toBe(150.0);
		expect(storePrice(150.0)).toBe(150.0);
	});

	it('no rule → rec null; manual 99.99 stored as 99.99', () => {
		expect(recommendPrice(0.96, null)).toBeNull();
		expect(recommendPrice(0.96, undefined)).toBeNull();
		expect(storePrice(99.99)).toBe(99.99);
	});

	it('half-up on odd products', () => {
		// 0.96 * 12.505 = 12.0048 → 12.00; use a clearer case
		expect(recommendPrice(1, 12.345)).toBe(12.35);
	});
});
