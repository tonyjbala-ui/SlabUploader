<script lang="ts">
	import CapturePhotos from '$lib/components/CapturePhotos.svelte';
	import CaptureKnobs from '$lib/components/CaptureKnobs.svelte';
	import CaptureFields from '$lib/components/CaptureFields.svelte';
	import { loadKnobs, type KnobState } from '$lib/capture/knobs.js';
	import {
		isValidSku,
		newClientId,
		normalizeSku,
		postCalibratedDraft,
		type PhotoMeta
	} from '$lib/capture/api.js';
	import { decodeSourceToImageData } from '$lib/capture/decode-source.js';
	import { type MaskRunResult } from '$lib/capture/mask-bridge.js';
	import { drawMaskOverlay } from '$lib/capture/overlay.js';
	import { computeBdft, computeScale, computeSqft } from '$lib/math/area.js';
	import { confirmAxis, pickLengthAxis, type AxisBox } from '$lib/math/axis.js';
	import { summarizeWidths, type WidthSample } from '$lib/math/widths.js';

	type PhotoSlot = { id: string; file: File; url: string };

	let photos = $state<PhotoSlot[]>([]);
	let knobs = $state<KnobState>(loadKnobs());
	let maskNote = $state('');
	let lengthIn = $state(0);
	let thicknessIn = $state(1);
	let sku = $state('');
	/** Set when mask CV provides pixel count; Phase 0 may stay null. */
	let maskPixelCount = $state<number | null>(null);
	/** Longest axis px once axis is known; null until then. */
	let longestAxisPx = $state<number | null>(null);
	let maskConfirmed = $state(false);
	let axisConfirmed = $state(false);
	let axisRotationDeg = $state(0);

	let sqft = $state<number | null>(null);
	let bdft = $state<number | null>(null);
	let widthMin = $state(0);
	let widthMax = $state(0);
	let widthAvg = $state(0);

	let submitting = $state(false);
	let submitMsg = $state<string | null>(null);
	let submitErr = $state<string | null>(null);

	/** Decoded pixels from photos[0] for mask-bridge runMask. */
	let sourcePixels = $state<ImageData | null>(null);
	let decodeErr = $state<string | null>(null);
	let maskLive = $state(false);
	let lastMask = $state<NonNullable<MaskRunResult['result']> | null>(null);
	let overlayCanvas = $state<HTMLCanvasElement | null>(null);

	$effect(() => {
		const photo = photos[0] ?? null;
		lastMask = null;
		if (!photo) {
			sourcePixels = null;
			decodeErr = null;
			return;
		}
		let cancelled = false;
		decodeErr = null;
		decodeSourceToImageData(photo.file)
			.then((img) => {
				if (!cancelled) sourcePixels = img;
			})
			.catch((e) => {
				if (cancelled) return;
				sourcePixels = null;
				decodeErr = e instanceof Error ? e.message : 'Failed to decode photo';
			});
		return () => {
			cancelled = true;
		};
	});

	function onMaskRun(result: MaskRunResult) {
		if (result.live && result.maskPixelCount !== null) {
			maskPixelCount = result.maskPixelCount;
			maskLive = true;
			lastMask = result.result;
			return;
		}
		if (maskLive) {
			maskPixelCount = null;
			maskLive = false;
		}
		lastMask = result.result;
	}

	$effect(() => {
		drawMaskOverlay(overlayCanvas, lastMask);
	});

	// Recompute derived numbers from Lane A math when inputs exist.
	$effect(() => {
		if (maskPixelCount !== null && longestAxisPx !== null && lengthIn > 0) {
			try {
				const scale = computeScale(longestAxisPx, lengthIn);
				sqft = computeSqft(maskPixelCount, scale);
				bdft = computeBdft(sqft, thicknessIn);
			} catch {
				sqft = null;
				bdft = null;
			}
		} else if (sqft !== null && thicknessIn > 0) {
			try {
				bdft = computeBdft(sqft, thicknessIn);
			} catch {
				bdft = null;
			}
		} else {
			bdft = null;
		}
	});

	const canContinue = $derived(
		photos.length >= 1 &&
			photos.length <= 5 &&
			lengthIn > 0 &&
			thicknessIn > 0 &&
			isValidSku(normalizeSku(sku)) &&
			maskConfirmed &&
			axisConfirmed &&
			sqft !== null &&
			bdft !== null &&
			!submitting
	);

	function onConfirmAxis() {
		// Thin chrome: build a placeholder box so Lane A confirmAxis is exercised.
		// Real min-area rect comes from image mask later.
		const box: AxisBox = pickLengthAxis({
			center: { x: 0, y: 0 },
			lengthPx: longestAxisPx ?? 1000,
			widthPx: 400,
			angleRad: 0
		});
		const confirmed = confirmAxis(box, (axisRotationDeg * Math.PI) / 180);
		longestAxisPx = confirmed.lengthPx;
		axisConfirmed = true;
		if (!maskPixelCount) {
			// No CV yet — leave sqft null so Continue stays gated on real measure,
			// unless we already have provisional sqft from elsewhere.
		}
	}

	/**
	 * Phase 0 helper: when mask CV is absent, allow a provisional measure using
	 * typed length + a synthetic scale so Math imports are exercised end-to-end.
	 * Remove once Lane A mask supplies maskPixelCount + axis lengthPx.
	 */
	function useProvisionalMeasure() {
		if (!(lengthIn > 0)) return;
		const axisPx = 1000;
		longestAxisPx = axisPx;
		// TV-3 style placeholder area path: invent no store numbers — use a
		// deterministic provisional pixel count so computeSqft/Bdft run.
		// 0.64 sqft @ 96" with scale = 1000/96 ⇒ pixels = 0.64*144*(1000/96)^2
		const scale = computeScale(axisPx, lengthIn);
		maskPixelCount = Math.round(0.64 * 144 * scale * scale);
		maskLive = false;
		maskConfirmed = true;
		onConfirmAxis();
		const samples: WidthSample[] = [
			{ stationIn: 0, widthIn: 18 },
			{ stationIn: 6, widthIn: 18.2 },
			{ stationIn: 12, widthIn: 17.8 }
		];
		try {
			const stats = summarizeWidths(samples);
			widthMin = stats.min;
			widthMax = stats.max;
			widthAvg = stats.avg;
		} catch {
			widthMin = widthMax = widthAvg = 0;
		}
	}

	async function onContinue() {
		submitMsg = null;
		submitErr = null;
		const cleanSku = normalizeSku(sku);
		if (!canContinue || sqft === null || bdft === null) return;

		submitting = true;
		try {
			const meta: PhotoMeta[] = photos.map((_, i) => ({
				kind: 'inventory',
				role: i === 0 ? 'topdown' : 'extra',
				seq: i + 1
			}));
			const result = await postCalibratedDraft({
				data: {
					id: newClientId(),
					sku: cleanSku,
					length_in: lengthIn,
					thickness_in: thicknessIn,
					sqft,
					bdft,
					width_min_in: widthMin,
					width_max_in: widthMax,
					width_avg_in: widthAvg,
					client_rev: 1
				},
				files: photos.map((p) => p.file),
				meta
			});
			if (result.ok) {
				submitMsg = `Draft uploaded (${result.status}). Status should be calibrated.`;
			} else {
				const body = result.body as { error?: { message?: string } } | null;
				submitErr =
					body?.error?.message ??
					`Upload failed (${result.status}). Is the /api proxy reaching FastAPI?`;
			}
		} catch (e) {
			submitErr = e instanceof Error ? e.message : 'Upload failed';
		} finally {
			submitting = false;
		}
	}
</script>

<h1>Capture</h1>
<p class="lede">
	Photograph the slab, tune the mask knobs, confirm the cut and axis, enter length / thickness / SKU,
	then continue to upload a calibrated draft.
</p>

<CapturePhotos bind:photos disabled={submitting} />

<div class="block overlay-placeholder" aria-label="Mask overlay">
	<h2>Mask overlay</h2>
	<p class="hint">
		Live mask overlay on the selected photo. Tune knobs to re-run; confirm when the edge looks right.
	</p>
	<div class="preview">
		{#if photos[0]}
			<div class="stack">
				<img src={photos[0].url} alt="Source for mask overlay" />
				<canvas bind:this={overlayCanvas} class="mask-overlay" aria-hidden="true"></canvas>
			</div>
		{:else}
			<span class="muted">Add a photo to preview overlay</span>
		{/if}
	</div>
	{#if decodeErr}
		<p class="err">{decodeErr}</p>
	{:else if maskLive && maskPixelCount !== null}
		<p class="hint live">Live mask · {maskPixelCount} px</p>
	{/if}
	<label class="check">
		<input type="checkbox" bind:checked={maskConfirmed} disabled={submitting} />
		Mask edge looks right (confirm)
	</label>
</div>

<CaptureKnobs bind:knobs bind:maskNote source={sourcePixels} onrun={onMaskRun} />

<section class="block" aria-labelledby="axis-heading">
	<h2 id="axis-heading">Length axis</h2>
	<p class="hint">Confirm the axis follows the slab&apos;s prevailing length. Rotate if skewed.</p>
	<label>
		<span>Rotate (deg) <em>{axisRotationDeg}</em></span>
		<input
			type="range"
			min="-45"
			max="45"
			step="1"
			bind:value={axisRotationDeg}
			disabled={submitting}
		/>
	</label>
	<div class="row">
		<button type="button" class="secondary" disabled={submitting} onclick={onConfirmAxis}>
			Confirm axis
		</button>
		<label class="check">
			<input type="checkbox" bind:checked={axisConfirmed} disabled={submitting} />
			Axis confirmed
		</label>
	</div>
	{#if maskPixelCount === null}
		<p class="hint">
			No mask pixels yet.
			<button type="button" class="linkish" disabled={submitting || !(lengthIn > 0)} onclick={useProvisionalMeasure}>
				Use provisional measure (Phase 0)
			</button>
			to exercise Math imports until CV lands.
		</p>
	{:else if maskLive}
		<p class="hint">Using live mask pixel count ({maskPixelCount} px).</p>
	{/if}
</section>

<CaptureFields bind:lengthIn bind:thicknessIn bind:sku bind:sqft bind:bdft />

<div class="actions">
	<button type="button" class="primary" disabled={!canContinue} onclick={onContinue}>
		{submitting ? 'Uploading…' : 'Continue'}
	</button>
	<p class="hint">
		Posts multipart calibrated draft to <code>POST /api/v1/slabs</code> (relative
		<code>/api</code> → Vite/Caddy proxy → FastAPI).
	</p>
	{#if submitMsg}
		<p class="ok">{submitMsg}</p>
	{/if}
	{#if submitErr}
		<p class="err">{submitErr}</p>
	{/if}
</div>

<style>
	h1 {
		margin: 0 0 0.35rem;
		font-size: 1.5rem;
	}
	.lede {
		margin: 0 0 1.25rem;
		color: var(--muted);
		font-size: 0.9rem;
	}
	.preview {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 12rem;
		border: 1px dashed var(--border);
		border-radius: 0.5rem;
		overflow: hidden;
		background: var(--panel);
		margin-bottom: 0.75rem;
	}
	.stack {
		position: relative;
		display: inline-block;
		max-width: 100%;
	}
	.preview img,
	.preview canvas.mask-overlay {
		display: block;
		max-width: 100%;
		max-height: 16rem;
		object-fit: contain;
	}
	.preview canvas.mask-overlay {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}
	.muted {
		color: var(--muted);
		font-size: 0.85rem;
	}
	.hint.live {
		margin-bottom: 0.65rem;
	}
	.check {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		font-size: 0.9rem;
	}
	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.75rem;
		margin-top: 0.65rem;
	}
	.actions {
		margin-top: 0.5rem;
	}
	.ok {
		color: var(--ok);
		font-size: 0.85rem;
	}
	.err {
		color: var(--danger);
		font-size: 0.85rem;
	}
	.linkish {
		background: none;
		border: none;
		color: var(--accent);
		cursor: pointer;
		padding: 0;
		font: inherit;
		text-decoration: underline;
	}
	label em {
		font-style: normal;
		color: var(--muted);
	}
	code {
		font-size: 0.8em;
	}
</style>
