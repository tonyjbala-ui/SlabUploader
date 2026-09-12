/**
 * TECH-SPEC-PIPELINE.md §7.1 — code constants (not Settings).
 */
export const FILL_TARGET = 0.8;
export const ASPECT_W = 3;
export const ASPECT_H = 4;
export const OUTPUT_PX_MIN = 1600;
export const WIDTH_SAMPLE_IN = 6;
export const INCH_STEP = 0.125;
export const AREA_DECIMALS = 2;
export const BDFT_DECIMALS = 2;
export const PRICE_DECIMALS = 2;

/** Portrait aspect ratio width/height = 3/4. */
export const ASPECT_RATIO = ASPECT_W / ASPECT_H;

/**
 * TECH-SPEC-PIPELINE.md §7.2 — factory defaults for persisted BG settings.
 */
export const SHEET_DEFAULT = 'auto' as const;
export const GREEN_HUE_LO = 35;
export const GREEN_HUE_HI = 85;
export const GREEN_SAT_MIN = 40;
export const GREEN_VAL_MIN = 40;
export const BLACK_THRESH = 30;
