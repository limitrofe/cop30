<script>
	export let listType = 'unordered'; // 'unordered' | 'ordered'
	export let items = [];
	export let align = 'left';
	export let maxWidth = '700px';
	export let spacing = '1.4rem';
	export let textColor = '';
	export let markerColor = '';

	const isOrdered = listType === 'ordered';
	$: safeItems = Array.isArray(items) ? items.filter((item) => item && item.text?.trim()) : [];
	$: containerStyle = [
		`max-width:${maxWidth}`,
		align ? `text-align:${align}` : '',
		textColor ? `color:${textColor}` : ''
	]
		.filter(Boolean)
		.join('; ');
	$: markerStyle = markerColor ? `color:${markerColor}` : '';
</script>

{#if safeItems.length}
	<div class="story-list" style={containerStyle}>
		{#if isOrdered}
			<ol style={`gap:${spacing}; ${markerStyle}`}>
				{#each safeItems as item}
					<li>{@html item.text}</li>
				{/each}
			</ol>
		{:else}
			<ul style={`gap:${spacing}; ${markerStyle}`}>
				{#each safeItems as item}
					<li>{@html item.text}</li>
				{/each}
			</ul>
		{/if}
	</div>
{/if}

<style>
	.story-list {
		margin: 2rem auto;
		padding: 0 1rem;
	}

	ul,
	ol {
		display: flex;
		flex-direction: column;
		margin: 0;
		padding-left: 1.5rem;
		color: inherit;
	}

	ul {
		list-style: disc;
	}

	ol {
		list-style: decimal;
	}

	li {
		margin: 0.4rem 0;
		line-height: 1.6;
	}

	@media (max-width: 768px) {
		.story-list {
			padding: 0;
			max-width: 100%;
		}

		ul,
		ol {
			padding-left: 1.25rem;
		}
	}
</style>
