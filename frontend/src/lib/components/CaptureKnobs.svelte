/**
 * Four knobs chrome (sheet / sensitivity / edge / feather). Live re-run via mask-bridge.
 */
<script lang="ts">
	import {
		type KnobState,
		loadKnobs,
		resetKnobs,
		saveKnobs
	} from '$lib/capture/knobs.js';
	import { rerunMask, type MaskRunResult } from '$lib/capture/mask-bridge.js';

	let {
		knobs = $bindable(loadKnobs()),
		maskNote = $bindable('')
	}: {
		knobs?: KnobState;
		maskNote?: string;
	} = $props();

	function apply(next: KnobState) {
		knobs = next;
		saveKnobs(next);
		const result: MaskRunResult = rerunMask(next, null);
		maskNote = result.message;
	}

	function onSheet(ev: Event) {
		const v = (ev.currentTarget as HTMLSelectElement).value as KnobState['sheet'];
		apply({ ...knobs, sheet: v });
	}

	function onSensitivity(ev: Event) {
		apply({ ...knobs, sensitivity: Number((ev.currentTarget as HTMLInputElement).value) });
	}

	function onEdge(ev: Event) {
		apply({ ...knobs, edgeOffsetPx: Number((ev.currentTarget as HTMLInputElement).value) });
	}

	function onFeather(ev: Event) {
		apply({ ...knobs, featherPx: Number((ev.currentTarget as HTMLInputElement).value) });
	}

	function onReset() {
		apply(resetKnobs());
	}

	$effect(() => {
		if (!maskNote) {
			maskNote = rerunMask(knobs, null).message;
		}
	});
</script>

<section class="block" aria-labelledby="knobs-heading">
	<div class="head">
		<h2 id="knobs-heading">Mask knobs</h2>
		<button type="button" class="secondary" onclick={onReset}>Reset defaults</button>
	</div>
	<p class="hint">Changes re-run background removal immediately (client-side). Overlay refreshes when mask CV runMask is wired.</p>

	<div class="knobs">
		<label>
			<span>Sheet</span>
			<select value={knobs.sheet} onchange={onSheet}>
				<option value="auto">auto</option>
				<option value="green">green</option>
				<option value="black">black</option>
			</select>
		</label>

		<label>
			<span>Sensitivity <em>{knobs.sensitivity.toFixed(2)}</em></span>
			<input
				type="range"
				min="0"
				max="1"
				step="0.01"
				value={knobs.sensitivity}
				oninput={onSensitivity}
			/>
		</label>

		<label>
			<span>Edge offset <em>{knobs.edgeOffsetPx}px</em></span>
			<input
				type="range"
				min="-8"
				max="8"
				step="1"
				value={knobs.edgeOffsetPx}
				oninput={onEdge}
			/>
		</label>

		<label>
			<span>Feather <em>{knobs.featherPx}px</em></span>
			<input
				type="range"
				min="0"
				max="6"
				step="1"
				value={knobs.featherPx}
				oninput={onFeather}
			/>
		</label>
	</div>

	{#if maskNote}
		<p class="note" role="status">{maskNote}</p>
	{/if}
</section>

<style>
	.head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.75rem;
	}
	.knobs {
		display: grid;
		gap: 0.85rem;
	}
	label {
		display: grid;
		gap: 0.35rem;
		font-size: 0.9rem;
	}
	label em {
		font-style: normal;
		color: var(--muted);
		margin-left: 0.35rem;
	}
	select,
	input[type='range'] {
		width: 100%;
	}
	.note {
		margin: 0.75rem 0 0;
		font-size: 0.8rem;
		color: var(--muted);
	}
</style>
