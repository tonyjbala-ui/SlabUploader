import { AREA_DECIMALS, BDFT_DECIMALS, INCH_STEP, PRICE_DECIMALS } from './constants.js';

/**
 * Half-up rounding to `decimals` places (positive and negative).
 * Uses the exponential-string trick to avoid IEEE 754 half-edge errors
 * (e.g. 11.525 → 11.53, 12.345 → 12.35).
 */
export function roundHalfUp(value: number, decimals: number): number {
	if (!Number.isFinite(value)) {
		throw new RangeError(`roundHalfUp: value must be finite, got ${value}`);
	}
	if (!Number.isInteger(decimals) || decimals < 0) {
		throw new RangeError(`roundHalfUp: decimals must be a non-negative integer, got ${decimals}`);
	}
	const sign = value < 0 ? -1 : 1;
	const abs = Math.abs(value);
	// Number(Math.round(Number(n + 'e' + d)) + 'e-' + d) — classic half-up
	const rounded =
		Number(Math.round(Number(abs + 'e' + decimals)) + 'e-' + decimals);
	return sign * rounded;
}

/** Nearest 1/8 inch (TECH-SPEC §2 / TV-10). */
export function roundLengthToEighth(inches: number): number {
	if (!Number.isFinite(inches)) {
		throw new RangeError(`roundLengthToEighth: inches must be finite, got ${inches}`);
	}
	const steps = Math.round(inches / INCH_STEP);
	// Re-quantize through half-up at 3 decimals so 0.125 multiples stay clean
	return roundHalfUp(steps * INCH_STEP, 3);
}

/** Area / sqft to AREA_DECIMALS (2), half-up. */
export function roundArea(sqft: number): number {
	return roundHalfUp(sqft, AREA_DECIMALS);
}

/** Bdft to BDFT_DECIMALS (2), half-up. */
export function roundBdft(bdft: number): number {
	return roundHalfUp(bdft, BDFT_DECIMALS);
}

/** Price / money to PRICE_DECIMALS (2), half-up. */
export function roundPrice(price: number): number {
	return roundHalfUp(price, PRICE_DECIMALS);
}

/** Generic 2-decimal half-up helper (alias used by callers). */
export function roundTo2Decimals(value: number): number {
	return roundHalfUp(value, 2);
}
