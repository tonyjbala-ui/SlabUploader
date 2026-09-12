<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import HealthStatus from '$lib/components/HealthStatus.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>SlabUploader</title>
</svelte:head>

<div class="app">
	<header class="top">
		<strong>SlabUploader</strong>
		<HealthStatus />
	</header>
	<main>
		{@render children()}
	</main>
</div>

<style>
	:global(:root) {
		color-scheme: light dark;
		--bg: #0f1115;
		--panel: #181b22;
		--text: #e8eaed;
		--muted: #9aa0a6;
		--border: #2a2f3a;
		--accent: #7cb3ff;
		--danger: #f07178;
		--ok: #7fd99a;
		font-family: system-ui, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
		line-height: 1.4;
	}
	:global(html, body) {
		margin: 0;
		min-height: 100%;
		background: var(--bg);
		color: var(--text);
	}
	:global(button.primary) {
		background: var(--accent);
		color: #0b1020;
		border: none;
		border-radius: 0.45rem;
		padding: 0.65rem 1rem;
		font: inherit;
		font-weight: 600;
		cursor: pointer;
	}
	:global(button.primary:disabled) {
		opacity: 0.45;
		cursor: not-allowed;
	}
	:global(button.secondary) {
		background: transparent;
		color: var(--text);
		border: 1px solid var(--border);
		border-radius: 0.4rem;
		padding: 0.35rem 0.65rem;
		font: inherit;
		cursor: pointer;
	}
	:global(.block) {
		margin: 0 0 1.25rem;
		padding: 1rem;
		border: 1px solid var(--border);
		border-radius: 0.65rem;
		background: color-mix(in srgb, var(--panel) 88%, transparent);
	}
	:global(.block h2) {
		margin: 0 0 0.35rem;
		font-size: 1.05rem;
	}
	:global(.hint) {
		margin: 0 0 0.85rem;
		font-size: 0.8rem;
		color: var(--muted);
	}
	.app {
		max-width: 32rem;
		margin: 0 auto;
		padding: 1rem 1rem 3rem;
	}
	.top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1rem;
	}
	main {
		display: block;
	}
</style>
