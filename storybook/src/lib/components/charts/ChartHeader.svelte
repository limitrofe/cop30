<script>
	export let title = '';
	export let titleTag = 'h3';
	export let titleColor = '';
	export let description = '';
	export let descriptionColor = '';
	export let notes = [];
	export let noteColor = '';

	const levelWhitelist = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);
	$: headingTag = levelWhitelist.has((titleTag || '').toLowerCase())
		? titleTag.toLowerCase()
		: 'h3';

	function normalizeArray(value) {
		if (!value) return [];
		if (Array.isArray(value))
			return value.filter((item) => typeof item === 'string' && item.trim());
		if (typeof value === 'string') {
			const trimmed = value.trim();
			if (!trimmed) return [];
			try {
				const parsed = JSON.parse(trimmed);
				if (Array.isArray(parsed))
					return parsed.filter((item) => typeof item === 'string' && item.trim());
			} catch (error) {
				/* ignore */
			}
			return trimmed
				.split(/\r?\n/)
				.map((line) => line.trim())
				.filter(Boolean);
		}
		return [];
	}

	$: normalizedNotes = normalizeArray(notes);
</script>

<header class="chart-header">
	{#if title}
		<svelte:element this={headingTag} style={titleColor ? `color:${titleColor}` : undefined}>
			{title}
		</svelte:element>
	{/if}
	{#if description}
		<p style={descriptionColor ? `color:${descriptionColor}` : undefined}>
			{description}
		</p>
	{/if}
	{#if normalizedNotes.length}
		<ul class="chart-notes" style={noteColor ? `color:${noteColor}` : undefined}>
			{#each normalizedNotes as note}
				<li>{note}</li>
			{/each}
		</ul>
	{/if}
</header>

<style>
	.chart-header {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
	}

	.chart-header :global(h1),
	.chart-header :global(h2),
	.chart-header :global(h3),
	.chart-header :global(h4),
	.chart-header :global(h5),
	.chart-header :global(h6) {
		margin: 0;
		font-size: clamp(1.1rem, 1.9vw, 1.4rem);
		font-weight: 600;
		line-height: 1.35;
	}

	.chart-header p {
		margin: 0;
		color: var(--chart-muted, #475569);
		font-size: 0.95rem;
		line-height: 1.55;
	}

	.chart-notes {
		margin: 0;
		padding-left: 1rem;
		color: var(--chart-muted, #475569);
		font-size: 0.82rem;
		line-height: 1.4;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.chart-notes li {
		list-style: disc;
	}
</style>
