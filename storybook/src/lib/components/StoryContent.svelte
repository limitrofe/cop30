<script>
	let { intro = null, paragraphs = [] } = $props();
</script>

{#if intro && intro.text}
	<div class="intro">
		<p>{intro.text}</p>
	</div>
{/if}

<div class="content">
	{#each paragraphs as item}
		{#if item.type === 'paragraph'}
			<p>{item.text}</p>
		{:else if item.type === 'quote'}
			<blockquote>
				<p>"{item.text}"</p>
				{#if item.author}
					<footer>
						— {item.author}
						{#if item.role}, {item.role}{/if}
					</footer>
				{/if}
			</blockquote>
		{/if}
	{/each}
</div>

<style>
	.intro {
		background: #f8f9fa;
		padding: 2rem;
		border-radius: 8px;
		border-left: 4px solid #007acc;
		margin-bottom: 2rem;
		font-size: 1.3rem;
		line-height: 1.6;
		color: #333;
	}

	.content {
		font-size: 1.1rem;
		line-height: 1.7;
		color: #333;
	}

	.content p {
		margin-bottom: 1.5rem;
	}

	blockquote {
		background: #f0f8ff;
		border-left: 4px solid #007acc;
		margin: 2rem 0;
		padding: 1.5rem;
		border-radius: 6px;
		font-style: italic;
	}

	blockquote p {
		font-size: 1.2rem;
		margin-bottom: 1rem;
		color: #2c3e50;
	}

	blockquote footer {
		font-size: 1rem;
		color: #666;
		font-style: normal;
		font-weight: 600;
	}
</style>
