<script>
	export let sourceLabel = '';
	export let sourceUrl = '';
	export let sourceColor = '';
	export let footnote = '';
	export let footnoteColor = '';
</script>

<footer class="chart-footer">
	{#if sourceLabel}
		<p class="chart-source" style={sourceColor ? `color:${sourceColor}` : undefined}>
			<strong>Fonte:</strong>
			{#if sourceUrl}
				<a href={sourceUrl} target="_blank" rel="noopener noreferrer">{sourceLabel}</a>
			{:else}
				{sourceLabel}
			{/if}
		</p>
	{/if}
	{#if footnote}
		<p class="chart-footnote" style={footnoteColor ? `color:${footnoteColor}` : undefined}>
			{footnote}
		</p>
	{/if}
</footer>

<style>
	.chart-footer {
		margin-top: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.chart-source,
	.chart-footnote {
		margin: 0;
		font-size: 0.78rem;
		color: var(--chart-muted, #475569);
	}

	.chart-source a {
		color: inherit;
		text-decoration: underline;
		text-decoration-thickness: 1px;
		text-underline-offset: 3px;
	}
</style>
