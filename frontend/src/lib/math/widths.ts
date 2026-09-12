import { WIDTH_SAMPLE_IN } from './constants.js';
import { roundTo2Decimals } from './units.js';

/**
 * Width sampling contract (TECH-SPEC §4.4 / TV-4).
 * Stations every WIDTH_SAMPLE_IN (6") along the confirmed length axis,
 * perpendicular to it. Listing gets min, max, average.
 *
 * Full CV (ray casting through mask) may be wired later; this module locks
 * the pure aggregation + station math.
 */

export type WidthSample = {
	/** Inches along length axis from start (0, 6, 12, …). */
	stationIn: number;
	/** Measured width at station, inches. */
	widthIn: number;
};

export type WidthStats = {
	min: number;
	max: number;
	avg: number;
	samples: WidthSample[];
};

/** Station positions in inches for a given length (exclusive of the far end if exact). */
export function widthStations(lengthInches: number, stepIn: number = WIDTH_SAMPLE_IN): number[] {
	if (!(lengthInches > 0)) {
		throw new RangeError(`widthStations: lengthInches must be > 0, got ${lengthInches}`);
	}
	if (!(stepIn > 0)) {
		throw new RangeError(`widthStations: stepIn must be > 0, got ${stepIn}`);
	}
	const stations: number[] = [];
	// Include 0 and every step while station < length (not past the far end).
	for (let s = 0; s <= lengthInches + 1e-9; s = roundTo2Decimals(s + stepIn)) {
		if (s > lengthInches + 1e-9) break;
		stations.push(roundTo2Decimals(s));
		// Guard against float drift locking the loop
		if (stations.length > 10_000) break;
	}
	// Ensure final end is included when length is not an exact multiple? Spec says
	// "every 6 along the confirmed length axis". Include 0 and stations while <= L.
	return stations;
}

/** Aggregate min / max / avg from measured samples (TV-4 contract). */
export function summarizeWidths(samples: WidthSample[]): WidthStats {
	if (samples.length === 0) {
		throw new RangeError('summarizeWidths: need at least one sample');
	}
	let min = Infinity;
	let max = -Infinity;
	let sum = 0;
	for (const s of samples) {
		if (!Number.isFinite(s.widthIn) || s.widthIn < 0) {
			throw new RangeError(`summarizeWidths: bad widthIn ${s.widthIn}`);
		}
		min = Math.min(min, s.widthIn);
		max = Math.max(max, s.widthIn);
		sum += s.widthIn;
	}
	return {
		min: roundTo2Decimals(min),
		max: roundTo2Decimals(max),
		avg: roundTo2Decimals(sum / samples.length),
		samples: [...samples]
	};
}
