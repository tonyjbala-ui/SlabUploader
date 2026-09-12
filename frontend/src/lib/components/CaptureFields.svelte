/**
 * Length / thickness / SKU fields + sqft/bdft display from Lane A math.
 */
<script lang="ts">
	import { INCH_STEP } from '$lib/math/constants.js';
	import { computeBdft } from '$lib/math/area.js';
	import { roundLengthToEighth } from '$lib/math/units.js';

	let {
		lengthIn = $bindable(0),
		thicknessIn = $bindable(1),
		sku = $bindable(''),
		/** Provisional sqft from mask pipeline when available; null until then. */
		sqft = $bindable(null as number | null),
		bdft = $bindable(null as number | null)
	}: {
		lengthIn?: number;
		thicknessIn?: number;
		sku?: string;
		sqft?: number | null;
		bdft?: number | null;
	} = $props();

	const thicknessOptions = Array.from({ length: 33 }, (_, i) =>
		roundLengthToEighth(0.5 + i * INCH_STEP)
	);

	$effect(() => {
		if (sqft !== null && thicknessIn > 0) {
			try {
				bdft = computeBdft(sqft, thicknessIn);
			} catch {
				bdft = null;
			}
		} else {
			bdft = null;
		}
	});

	function onLength(ev: Event) {
		const raw = Number((ev.currentTarget as HTMLInputElement).value);
		lengthIn = Number.isFinite(raw) && raw > 0 ? roundLengthToEighth(raw) : 0;
	}

	function onThickness(ev: Event) {
		thicknessIn = Number((ev.currentTarget as HTMLSelectElement).value);
	}

	function onSku(ev: Event) {
		sku = (ev.currentTarget as HTMLInputElement).value.toUpperCase();
	}

	function fmt(n: number | null): string {
		return n === null ? '—' : n.toFixed(2);
	}
</script>

<section class="block" aria-labelledby="fields-heading">
	<h2 id="fields-heading">Numbers</h2>
	<p class="hint">Length and thickness in 1/8&quot; steps. SKU is typed by hand. Sqft/bdft come from Math when a mask is available.</p>

	<div class="fields">
		<label>
			<span>Length (in)</span>
			<input
				type="number"
				min={INCH_STEP}
				step={INCH_STEP}
				value={lengthIn || ''}
				oninput={onLength}
				inputmode="decimal"
			/>
		</label>

		<label>
			<span>Thickness (in)</span>
			<select value={thicknessIn} onchange={onThickness}>
				{#each thicknessOptions as t}
					<option value={t}>{t}</option>
				{/each}
			</select>
		</label>

		<label class="wide">
			<span>SKU</span>
			<input
				type="text"
				maxlength="24"
				pattern={'[A-Z0-9-]{3,24}'}
				placeholder="e.g. SLAB-UAT-001"
				value={sku}
				oninput={onSku}
				autocomplete="off"
				spellcheck="false"
			/>
		</label>
	</div>

	<dl class="metrics">
		<div>
			<dt>Square feet</dt>
			<dd>{fmt(sqft)}</dd>
		</div>
		<div>
			<dt>Board feet</dt>
			<dd>{fmt(bdft)}</dd>
		</div>
	</dl>
</section>

<style>
	.fields {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}
	.fields .wide {
		grid-column: 1 / -1;
	}
	label {
		display: grid;
		gap: 0.35rem;
		font-size: 0.9rem;
	}
	input,
	select {
		font: inherit;
		padding: 0.45rem 0.55rem;
		border: 1px solid var(--border);
		border-radius: 0.4rem;
		background: var(--panel);
		color: inherit;
	}
	.metrics {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
		margin: 1rem 0 0;
	}
	.metrics div {
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		padding: 0.65rem 0.75rem;
		background: var(--panel);
	}
	.metrics dt {
		font-size: 0.75rem;
		color: var(--muted);
	}
	.metrics dd {
		margin: 0.15rem 0 0;
		font-size: 1.25rem;
		font-variant-numeric: tabular-nums;
	}
</style>
