<!-- src/lib/components/story/RecommendedItems.svelte -->
<script>
	export let items = [];
	export let title = 'CONTEÚDOS RECOMENDADOS';
	export let layout = 'grid'; // 'grid', 'carousel'
	export let columns = 5;
	export let showTitle = true;
	export let backgroundColor = '#000100';
	export let titleColor = '#ffffff';
	export let textColor = '#ffffff';

	let container;
	let isDragging = false;
	let startX = 0;
	let scrollLeft = 0;

	function handleMouseDown(e) {
		if (layout !== 'carousel') return;
		isDragging = true;
		startX = e.pageX - container.offsetLeft;
		scrollLeft = container.scrollLeft;
		container.style.cursor = 'grabbing';
	}

	function handleMouseLeave() {
		if (layout !== 'carousel') return;
		isDragging = false;
		container.style.cursor = 'grab';
	}

	function handleMouseUp() {
		if (layout !== 'carousel') return;
		isDragging = false;
		container.style.cursor = 'grab';
	}

	function handleMouseMove(e) {
		if (!isDragging || layout !== 'carousel') return;
		e.preventDefault();
		const x = e.pageX - container.offsetLeft;
		const walk = (x - startX) * 2;
		container.scrollLeft = scrollLeft - walk;
	}

	function handleItemClick(item) {
		if (item.link) {
			window.open(item.link, '_blank');
		}
	}
</script>

<section
	class="recommended-items"
	style={`--bg-color:${backgroundColor ?? 'transparent'}; --title-color:${titleColor || 'var(--color-text)'}; --text-color:${textColor || 'var(--color-text)'}; --columns:${columns}; --title-font-size-desktop:${titleFontSizeDesktop || ''}; --title-font-size-mobile:${titleFontSizeMobile || ''}; --item-title-font-size-desktop:${itemTitleFontSizeDesktop || ''}; --item-title-font-size-mobile:${itemTitleFontSizeMobile || ''}; --item-text-font-size-desktop:${itemTextFontSizeDesktop || ''}; --item-text-font-size-mobile:${itemTextFontSizeMobile || ''};`}
>
	{#if showTitle && title}
		<h2 class="recommended-title">{title}</h2>
	{/if}

	<div
		class="items-container items-container--{layout}"
		bind:this={container}
		on:mousedown={handleMouseDown}
		on:mouseleave={handleMouseLeave}
		on:mouseup={handleMouseUp}
		on:mousemove={handleMouseMove}
	>
		{#each items as item, index}
			<div
				class="recommended-item"
				on:click={() => handleItemClick(item)}
				on:keydown={(e) => e.key === 'Enter' && handleItemClick(item)}
				tabindex="0"
				role="button"
			>
				<div class="item-image">
					<img src={item.image} alt={item.title || ''} loading="lazy" />
					{#if item.duration}
						<div class="duration-badge">{item.duration}</div>
					{/if}
					{#if item.badge}
						<div class="item-badge">{item.badge}</div>
					{/if}
					{#if item.isNew}
						<div class="new-badge">NOVO</div>
					{/if}
				</div>

				<div class="item-content">
					{#if item.category}
						<div class="item-category">{item.category}</div>
					{/if}

					<h3 class="item-title">{item.title}</h3>

					{#if item.subtitle}
						<p class="item-subtitle">{item.subtitle}</p>
					{/if}

					{#if item.description}
						<p class="item-description">{item.description}</p>
					{/if}

					{#if item.year || item.rating || item.genre}
						<div class="item-meta">
							{#if item.year}
								<span class="meta-year">{item.year}</span>
							{/if}
							{#if item.rating}
								<span class="meta-rating">{item.rating}</span>
							{/if}
							{#if item.genre}
								<span class="meta-genre">{item.genre}</span>
							{/if}
						</div>
					{/if}
				</div>
			</div>
		{/each}
	</div>
</section>

<style>
	.recommended-items {
		padding: 2rem 0;
		background-color: var(--bg-color, transparent);
		color: var(--text-color, var(--color-text));
		margin: 2rem 0;
		text-align: center;
	}

	.recommended-title {
		font-size: var(--title-font-size-desktop, var(--typography-h3-desktop-font-size, 2.6rem));
		font-weight: 600;
		color: var(--title-color, var(--color-text));
		margin: 0 0 1.5rem 0;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		font-family: 'obviously', sans-serif;
	}

	.items-container {
		display: grid;
		gap: 1rem;
		justify-content: center; /* Centraliza o grid de itens */
	}

	.items-container--grid {
		grid-template-columns: repeat(var(--columns, 5), 1fr);
	}

	.items-container--carousel {
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		overflow-x: auto;
		overflow-y: hidden;
		scroll-behavior: smooth;
		cursor: grab;
		padding-bottom: 1rem;
		justify-content: center; /* Centraliza se o conteúdo for menor que a tela */
	}

	.items-container--carousel::-webkit-scrollbar {
		height: 8px;
	}

	.items-container--carousel::-webkit-scrollbar-track {
		background: rgba(255, 255, 255, 0.1);
		border-radius: 4px;
	}

	.items-container--carousel::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.3);
		border-radius: 4px;
	}

	.items-container--carousel::-webkit-scrollbar-thumb:hover {
		background: rgba(255, 255, 255, 0.5);
	}

	.recommended-item {
		cursor: pointer;
		transition:
			transform 0.3s ease,
			box-shadow 0.3s ease;
		border-radius: 8px;
		overflow: hidden;
		background: var(--recommended-card-bg, transparent);
		backdrop-filter: blur(10px);
	}

	.recommended-item:hover {
		transform: translateY(-4px);
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
	}

	.recommended-item:focus {
		outline: 2px solid var(--title-color);
		outline-offset: 2px;
	}

	.item-image {
		position: relative;
		width: 70%;
		overflow: hidden;
		margin: 0 auto; /* Centraliza a imagem */
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.item-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.3s ease;
	}

	.recommended-item:hover .item-image img {
		transform: scale(1.05);
	}

	.duration-badge,
	.item-badge,
	.new-badge {
		position: absolute;
		top: 8px;
		right: 8px;
		background: rgba(0, 0, 0, 0.8);
		color: white;
		padding: 4px 8px;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.new-badge {
		background: var(--title-color);
		top: 8px;
		left: 8px;
	}

	.item-badge {
		background: #1f9cf0;
	}

	.item-content {
		padding: 1rem;
	}

	.item-category {
		font-size: 0.75rem;
		color: var(--title-color);
		text-transform: uppercase;
		letter-spacing: 1px;
		margin-bottom: 0.5rem;
		font-weight: 600;
	}

	.item-title {
		font-size: var(--item-title-font-size-desktop, 1rem);
		font-weight: 600;
		margin: 0 0 0.5rem 0;
		line-height: 1.2;
		color: var(--text-color, var(--color-text));
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.item-subtitle {
		font-size: 0.875rem;
		color: rgba(255, 255, 255, 0.8);
		margin: 0 0 0.5rem 0;
		display: -webkit-box;
		-webkit-line-clamp: 1;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.item-description {
		font-size: var(--item-text-font-size-desktop, 0.75rem);
		color: rgba(255, 255, 255, 0.7);
		margin: 0 0 0.75rem 0;
		line-height: 1.3;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.item-meta {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		justify-content: center; /* Centraliza os meta dados também */
	}

	.meta-year,
	.meta-rating,
	.meta-genre {
		font-size: 0.7rem;
		padding: 2px 6px;
		border-radius: 3px;
		background: rgba(255, 255, 255, 0.1);
		color: rgba(255, 255, 255, 0.8);
	}

	.meta-rating {
		background: #f39c12;
		color: white;
	}

	/* Responsive */
	@media (max-width: 1200px) {
		.items-container--grid {
			grid-template-columns: repeat(4, 1fr);
		}
	}

	@media (max-width: 768px) {
		.items-container--grid {
			grid-template-columns: repeat(2, 1fr);
		}

		.recommended-title {
			font-size: var(--title-font-size-mobile, var(--typography-h3-mobile-font-size, 2.2rem));
		}

		.item-content {
			padding: 0.75rem;
		}

		.recommended-item {
			display: flex;
			flex-direction: column;
			align-items: center;
			text-align: center;
		}

		.item-image {
			width: 60%;
		}

		.item-title {
			font-size: var(--item-title-font-size-mobile, 0.95rem);
		}

		.item-description {
			font-size: var(--item-text-font-size-mobile, 0.75rem);
		}

		.item-subtitle,
		.item-category {
			text-align: center;
			width: 100%;
		}
	}

	@media (max-width: 480px) {
		.items-container--grid {
			grid-template-columns: 1fr;
		}

		.recommended-items {
			padding: 1rem 0;
		}

		/* Mobile muito pequeno - imagem ainda menor */
		.item-image {
			width: 50%; /* Imagem mais pequena para telas muito pequenas */
		}
	}
</style>
