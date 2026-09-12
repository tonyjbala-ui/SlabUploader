import { roundArea, roundBdft } from './units.js';

/**
 * Pixel→inch scale from confirmed length axis (TECH-SPEC §4.3).
 * scale = longest_axis_px / L
 */
export function computeScale(longestAxisPx: number, lengthInches: number): number {
	if (!(longestAxisPx > 0)) {
		throw new RangeError(`computeScale: longestAxisPx must be > 0, got ${longestAxisPx}`);
	}
	if (!(lengthInches > 0)) {
		throw new RangeError(`computeScale: lengthInches must be > 0, got ${lengthInches}`);
	}
	return longestAxisPx / lengthInches;
}

/**
 * Projected top-down sqft from mask pixel count (TECH-SPEC §4.5).
 * sqft = (mask_pixel_count / scale²) / 144
 * Rounded to 2 decimals (half-up).
 */
export function computeSqft(maskPixelCount: number, scalePxPerInch: number): number {
	if (!(maskPixelCount >= 0) || !Number.isFinite(maskPixelCount)) {
		throw new RangeError(`computeSqft: maskPixelCount must be a finite >= 0, got ${maskPixelCount}`);
	}
	if (!(scalePxPerInch > 0)) {
		throw new RangeError(`computeSqft: scalePxPerInch must be > 0, got ${scalePxPerInch}`);
	}
	const sqin = maskPixelCount / (scalePxPerInch * scalePxPerInch);
	const sqft = sqin / 144;
	return roundArea(sqft);
}

/**
 * Board feet (TECH-SPEC §4.6).
 * bdft = sqft × thickness_in
 * NEVER divide by 12. Identity: 1 sqft @ 1" = 1 bdft.
 * Rounded to 2 decimals (half-up).
 */
export function computeBdft(sqft: number, thicknessInches: number): number {
	if (!Number.isFinite(sqft) || sqft < 0) {
		throw new RangeError(`computeBdft: sqft must be finite >= 0, got ${sqft}`);
	}
	if (!Number.isFinite(thicknessInches) || thicknessInches < 0) {
		throw new RangeError(
			`computeBdft: thicknessInches must be finite >= 0, got ${thicknessInches}`
		);
	}
	return roundBdft(sqft * thicknessInches);
}

/**
 * Convenience: sqft + bdft from mask metrics and user thickness.
 */
export function computeAreaAndBdft(args: {
	maskPixelCount: number;
	scalePxPerInch: number;
	thicknessInches: number;
}): { sqft: number; bdft: number } {
	const sqft = computeSqft(args.maskPixelCount, args.scalePxPerInch);
	const bdft = computeBdft(sqft, args.thicknessInches);
	return { sqft, bdft };
}
