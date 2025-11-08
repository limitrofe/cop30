<!-- src/lib/components/story/StoryText.svelte -->
<script>
	export let content = '';
	export let variant = 'body'; // 'body', 'lead', 'quote'
	export let align = 'left'; // 'left', 'center', 'right', 'justify'
	export let maxWidth = '700px';
	export let maxWidthDesktop = '';
	export let maxWidthMobile = '';
	export let widthDesktop = '';
	export let widthMobile = '';
	export let author = '';
	export let role = '';

	$: wrapperStyle = [
		`text-align:${align}`,
		maxWidth ? `--story-text-max-width-desktop:${maxWidth}` : '',
		maxWidthDesktop ? `--story-text-max-width-desktop:${maxWidthDesktop}` : '',
		maxWidthMobile ? `--story-text-max-width-mobile:${maxWidthMobile}` : '',
		widthDesktop ? `--story-text-width-desktop:${widthDesktop}` : '',
		widthMobile ? `--story-text-width-mobile:${widthMobile}` : ''
	]
		.filter(Boolean)
		.join('; ');
</script>

<div class="story-text story-text--{variant}" style={wrapperStyle}>
	<div class="story-text__content">
		{#if variant === 'quote'}
			<div class="quote-container">
				<blockquote class="modern-quote">
					<div class="quote-text">
						{@html content}
					</div>

					{#if author}
						<footer class="quote-attribution">
							<div class="attribution-line"></div>
							<div class="attribution-content">
								<cite class="author-name">{author}</cite>
								{#if role}
									<span class="author-role">{role}</span>
								{/if}
							</div>
						</footer>
					{/if}
				</blockquote>
			</div>
		{:else}
			{@html content}
		{/if}
	</div>
</div>

<style>
	.story-text {
		margin: 2rem auto;
		padding: 0 1rem;
		color: var(--color-text);
		width: var(--story-text-width-desktop, auto);
		max-width: var(--story-text-max-width-desktop, 700px);
	}

	.story-text__content {
		width: 100%;
	}

	/* Variant: Body Text */
	.story-text--body {
		font-size: var(--font-size-70);
		line-height: 1.7;
		font-weight: 400;
	}

	/* Variant: Lead Text */
	.story-text--lead {
		font-size: var(--font-size-90);
		line-height: 1.6;
		font-weight: 500;
		color: var(--color-secondary);
	}

	/* Variant: Quote - Design Moderno */
	.story-text--quote {
		margin: 1rem auto;
	}

	.quote-container {
		position: relative;
		background: var(--color-highlight-bg);
		border-radius: 24px;
		padding: 2.5rem;
		box-shadow:
			0 4px 24px rgba(196, 23, 12, 0.1),
			0 1px 3px rgba(196, 23, 12, 0.05);
		border: 1px solid var(--color-border);
		transition: all 0.3s ease;
	}

	.quote-container:hover {
		transform: translateY(-2px);
		box-shadow:
			0 8px 32px rgba(196, 23, 12, 0.15),
			0 2px 8px rgba(196, 23, 12, 0.1);
	}

	.quote-icon {
		position: absolute;
		top: -12px;
		left: 2rem;
		width: 48px;
		height: 36px;
		background: var(--color-primary);
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		box-shadow: 0 4px 12px rgba(196, 23, 12, 0.3);
	}

	.modern-quote {
		margin: 0;
		padding: 0;
		border: none;
	}

	.quote-text {
		font-size: var(--font-size-110);
		line-height: 1.4;
		font-weight: 600;
		color: var(--color-text);
		margin-top: 0;
		font-style: normal;
	}

	.quote-attribution {
		margin-top: 2rem;
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.attribution-line {
		width: 40px;
		height: 2px;
		background: linear-gradient(90deg, var(--color-primary), transparent);
		border-radius: 1px;
	}

	.attribution-content {
		flex: 1;
	}

	.author-name {
		font-style: normal;
		font-weight: 700;
		font-size: var(--font-size-60);
		color: var(--color-primary);
		display: block;
		margin-bottom: 0.25rem;
	}

	.author-role {
		font-size: var(--font-size-50);
		color: var(--color-secondary);
		font-weight: 500;
		opacity: 0.8;
	}

	/* Global text styling within content */
	.story-text :global(p) {
		margin: 1.5rem 0;
	}

	.story-text :global(strong) {
		font-weight: 700;
		color: var(--color-primary);
	}

	.story-text :global(em) {
		color: var(--color-accent);
		font-style: italic;
	}

	.story-text :global(a) {
		color: var(--color-primary);
		text-decoration: none;
		border-bottom: 1px solid currentColor;
		transition: all 0.3s ease;
	}

	.story-text :global(a:hover) {
		opacity: 0.8;
		transform: translateY(-1px);
	}

	/* Converte <br> em quebras de linha reais */
	.story-text :global(br) {
		display: block;
		margin: 0.5rem 0;
		content: '';
	}

	/* Estiliza bullet points se houver */
	.story-text :global(ul) {
		margin: 1rem 0;
		padding-left: 1rem;
	}

	.story-text :global(li) {
		margin: 0.5rem 0;
		list-style-type: disc;
	}

	/* Quote text specific styling */
	.quote-text :global(strong) {
		color: var(--color-primary);
		font-weight: 700;
	}

	.quote-text :global(em) {
		color: var(--color-secondary);
		font-style: italic;
		opacity: 0.9;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.story-text {
			width: var(--story-text-width-mobile, var(--story-text-width-desktop, auto));
			max-width: var(--story-text-max-width-mobile, var(--story-text-max-width-desktop, 700px));
		}

		.story-text--body {
			font-size: var(--font-size-60);
		}

		.story-text--lead {
			font-size: var(--font-size-80);
		}

		.quote-container {
			padding: 2rem 1.5rem;
			border-radius: 20px;
			margin: 2rem 0;
		}

		.quote-text {
			font-size: var(--font-size-90);
			margin-top: 0;
		}

		.attribution-line {
			width: 30px;
		}

		.author-name {
			font-size: var(--font-size-55);
		}

		.author-role {
			font-size: var(--font-size-45);
		}
	}

	/* Dark mode adjustments */
	@media (prefers-color-scheme: dark) {
		.quote-container {
			background: var(--color-highlight-bg);
			border-color: var(--color-border);
		}
	}

	/* Animation for quote entrance */
	@keyframes fadeInUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.quote-container {
		animation: fadeInUp 0.6s ease-out;
	}
</style>
