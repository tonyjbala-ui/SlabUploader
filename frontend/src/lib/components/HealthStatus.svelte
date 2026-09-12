/**
 * Tiny optional health fetch display (GET /api/health via relative /api proxy).
 */
<script lang="ts">
	import { fetchHealth, type HealthResponse } from '$lib/capture/api.js';
	import { onMount } from 'svelte';

	let health = $state<HealthResponse | null>(null);
	let error = $state<string | null>(null);
	let loading = $state(true);

	onMount(() => {
		const ac = new AbortController();
		fetchHealth(ac.signal)
			.then((h) => {
				health = h;
				error = null;
			})
			.catch((e: unknown) => {
				health = null;
				error = e instanceof Error ? e.message : 'unreachable';
			})
			.finally(() => {
				loading = false;
			});
		return () => ac.abort();
	});
</script>

<p class="health" role="status">
	{#if loading}
		API: checking…
	{:else if health}
		API: {health.status}{health.version ? ` · ${health.version}` : ''}
	{:else}
		API: offline ({error ?? 'no response'})
	{/if}
</p>

<style>
	.health {
		margin: 0;
		font-size: 0.75rem;
		color: var(--muted);
	}
</style>
