import { roundPrice } from './units.js';

export type SpeciesPriceRule = {
	speciesId: string;
	/** Dollars per board foot. Absent / null / undefined ⇒ no rule. */
	pricePerBdft: number | null | undefined;
};

/**
 * Recommended listing price (TECH-SPEC §6 / TV-8).
 * recommendation = bdft × pricePerBdft, half-up to 2 decimals.
 * Missing rule → null (empty; manual entry allowed).
 */
export function recommendPrice(
	bdft: number,
	pricePerBdft: number | null | undefined
): number | null {
	if (pricePerBdft === null || pricePerBdft === undefined) {
		return null;
	}
	if (!Number.isFinite(bdft) || bdft < 0) {
		throw new RangeError(`recommendPrice: bdft must be finite >= 0, got ${bdft}`);
	}
	if (!Number.isFinite(pricePerBdft) || pricePerBdft < 0) {
		throw new RangeError(
			`recommendPrice: pricePerBdft must be finite >= 0, got ${pricePerBdft}`
		);
	}
	return roundPrice(bdft * pricePerBdft);
}

/**
 * Lookup-style helper: resolve rule then recommend.
 */
export function recommendPriceFromRule(
	bdft: number,
	rule: SpeciesPriceRule | null | undefined
): number | null {
	if (!rule) return null;
	return recommendPrice(bdft, rule.pricePerBdft);
}

/**
 * Persist a user-entered or recommended price: half-up to 2 decimals.
 * Override sticks for that slab (caller responsibility).
 */
export function storePrice(price: number): number {
	if (!Number.isFinite(price) || price < 0) {
		throw new RangeError(`storePrice: price must be finite >= 0, got ${price}`);
	}
	return roundPrice(price);
}
