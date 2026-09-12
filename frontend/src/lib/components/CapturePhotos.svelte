/**
 * Photo intake chrome: 1–5 inventory photos (UX capture).
 */
<script lang="ts">
	const MAX_PHOTOS = 5;

	type PhotoSlot = {
		id: string;
		file: File;
		url: string;
	};

	let {
		photos = $bindable([] as PhotoSlot[]),
		disabled = false
	}: {
		photos?: PhotoSlot[];
		disabled?: boolean;
	} = $props();

	function onPick(ev: Event) {
		const input = ev.currentTarget as HTMLInputElement;
		const list = input.files;
		if (!list?.length) return;
		const room = MAX_PHOTOS - photos.length;
		const next = [...photos];
		for (let i = 0; i < list.length && next.length < MAX_PHOTOS; i++) {
			const file = list[i];
			if (!file.type.startsWith('image/')) continue;
			next.push({
				id: `${Date.now()}-${i}-${file.name}`,
				file,
				url: URL.createObjectURL(file)
			});
		}
		if (list.length > room) {
			// silently truncate to 5 — Phase 0 thin UI
		}
		photos = next;
		input.value = '';
	}

	function removeAt(index: number) {
		const copy = [...photos];
		const [removed] = copy.splice(index, 1);
		if (removed) URL.revokeObjectURL(removed.url);
		photos = copy;
	}
</script>

<section class="block" aria-labelledby="photos-heading">
	<h2 id="photos-heading">Photos</h2>
	<p class="hint">1–5 inventory shots. First should be top-down, lens parallel to the face.</p>

	<div class="grid">
		{#each photos as photo, i (photo.id)}
			<figure class="slot">
				<img src={photo.url} alt="Inventory photo {i + 1}" />
				<figcaption>
					{i === 0 ? 'top-down' : `extra ${i + 1}`}
					<button type="button" class="linkish" disabled={disabled} onclick={() => removeAt(i)}>Remove</button>
				</figcaption>
			</figure>
		{/each}

		{#if photos.length < MAX_PHOTOS}
			<label class="add">
				<span>Add photo ({photos.length}/{MAX_PHOTOS})</span>
				<input
					type="file"
					accept="image/*"
					capture="environment"
					multiple
					disabled={disabled}
					onchange={onPick}
				/>
			</label>
		{/if}
	</div>
</section>

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(7.5rem, 1fr));
		gap: 0.75rem;
	}
	.slot {
		margin: 0;
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		overflow: hidden;
		background: var(--panel);
	}
	.slot img {
		display: block;
		width: 100%;
		aspect-ratio: 3 / 4;
		object-fit: cover;
	}
	.slot figcaption {
		display: flex;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.35rem 0.5rem;
		font-size: 0.75rem;
	}
	.add {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 7.5rem;
		border: 1px dashed var(--border);
		border-radius: 0.5rem;
		padding: 0.75rem;
		cursor: pointer;
		background: var(--panel);
		font-size: 0.875rem;
	}
	.add input {
		display: none;
	}
	.linkish {
		background: none;
		border: none;
		color: var(--accent);
		cursor: pointer;
		padding: 0;
		font: inherit;
	}
</style>
