<!-- src/lib/components/story/PhotoGallery.svelte -->
<script>
	import { onMount } from 'svelte';

	export let images = [];
	export let layout = 'grid'; // 'grid', 'masonry', 'slider'
	export let columns = 3;
	export let gap = '1rem';
	export let backgroundColor = '';
	export let backgroundImage = '';
	export let backgroundVideo = '';
	export let lightbox = true;

	let currentIndex = 0;
	let showLightbox = false;
	let isMobile = false;

	function openLightbox(index) {
		if (!lightbox) return;
		currentIndex = index;
		showLightbox = true;
	}

	function closeLightbox() {
		showLightbox = false;
	}

	function nextImage() {
		currentIndex = (currentIndex + 1) % images.length;
	}

	function prevImage() {
		currentIndex = (currentIndex - 1 + images.length) % images.length;
	}

	const captionFor = (image) => {
		const desktop = image.captionDesktop ?? image.caption ?? '';
		const mobile = image.captionMobile ?? image.caption ?? '';
		return isMobile ? mobile || desktop : desktop || mobile;
	};

	const creditFor = (image) => {
		const desktop = image.creditDesktop ?? image.credit ?? '';
		const mobile = image.creditMobile ?? image.credit ?? '';
		return isMobile ? mobile || desktop : desktop || mobile;
	};

	let wrapperStyle = '';
	$: wrapperStyle = [
		gap ? `--gallery-gap:${gap}` : '',
		backgroundColor ? `background-color:${backgroundColor}` : '',
		backgroundImage ? `background-image:url(${backgroundImage})` : ''
	]
		.filter(Boolean)
		.join('; ');

	onMount(() => {
		if (typeof window === 'undefined') return;
		const media = window.matchMedia('(max-width: 768px)');
		const handleChange = (event) => {
			isMobile = event.matches;
		};
		handleChange(media);
		media.addEventListener('change', handleChange);
		return () => media.removeEventListener('change', handleChange);
	});
</script>

<section class="gallery-wrapper" style={wrapperStyle}>
	{#if backgroundVideo}
		<video class="gallery-bg" autoplay muted loop playsinline>
			<source src={backgroundVideo} type="video/mp4" />
		</video>
	{/if}

	<div class="gallery gallery--{layout}" style={`--columns:${columns};`}>
		{#each images as image, index}
			<button class="gallery-item" type="button" on:click={() => openLightbox(index)}>
				<picture>
					{#if image.srcMobile}
						<source srcset={image.srcMobile} media="(max-width: 768px)" />
					{/if}
					<img src={image.src} alt={image.alt || captionFor(image)} loading="lazy" />
				</picture>
				{#if captionFor(image) || creditFor(image)}
					<div class="gallery-caption">
						{#if captionFor(image)}
							<p>{captionFor(image)}</p>
						{/if}
						{#if creditFor(image)}
							<small>{creditFor(image)}</small>
						{/if}
					</div>
				{/if}
			</button>
		{/each}
	</div>
</section>

{#if lightbox && showLightbox}
	<div
		class="lightbox"
		role="dialog"
		aria-modal="true"
		tabindex="-1"
		on:click={closeLightbox}
		on:keydown={(event) => {
			if (event.key === 'Escape') closeLightbox();
			if (event.key === 'ArrowLeft') {
				event.preventDefault();
				prevImage();
			}
			if (event.key === 'ArrowRight') {
				event.preventDefault();
				nextImage();
			}
		}}
	>
		<div class="lightbox-content" role="document" on:click|stopPropagation>
			<button class="lightbox-close" on:click={closeLightbox}>×</button>

			{#if images.length > 1}
				<button class="lightbox-nav lightbox-prev" on:click={prevImage}>‹</button>
				<button class="lightbox-nav lightbox-next" on:click={nextImage}>›</button>
			{/if}

			<picture>
				{#if images[currentIndex].srcMobile}
					<source srcset={images[currentIndex].srcMobile} media="(max-width: 768px)" />
				{/if}
				<img
					src={images[currentIndex].src}
					alt={images[currentIndex].alt || captionFor(images[currentIndex])}
					loading="lazy"
				/>
			</picture>

			{#if captionFor(images[currentIndex]) || creditFor(images[currentIndex])}
				<div class="lightbox-caption">
					{#if captionFor(images[currentIndex])}
						<p>{captionFor(images[currentIndex])}</p>
					{/if}
					{#if creditFor(images[currentIndex])}
						<small>{creditFor(images[currentIndex])}</small>
					{/if}
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.gallery-wrapper {
		position: relative;
		padding: 2rem 0;
		background-repeat: no-repeat;
		background-size: cover;
		background-position: center;
	}

	.gallery-bg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		opacity: 0.4;
		z-index: 0;
	}

	.gallery {
		position: relative;
		z-index: 1;
		display: grid;
		gap: var(--gallery-gap, 1rem);
	}

	.gallery--grid {
		grid-template-columns: repeat(var(--columns, 3), 1fr);
	}

	.gallery--masonry {
		display: block;
		columns: var(--columns, 3);
		column-gap: var(--gallery-gap, 1rem);
	}

	.gallery-item {
		position: relative;
		cursor: pointer;
		border-radius: 8px;
		overflow: hidden;
		break-inside: avoid;
		margin-bottom: 1rem;
		transition: transform 0.3s ease;
		border: none;
		background: transparent;
		padding: 0;
	}

	.gallery-item:focus {
		outline: 2px solid var(--color-primary, #2563eb);
		outline-offset: 4px;
	}

	.gallery--grid .gallery-item:hover {
		transform: scale(1.02);
	}

	.gallery-item picture,
	.gallery-item img {
		width: 100%;
		height: auto;
		display: block;
	}

	.gallery-caption {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		background: linear-gradient(transparent, rgba(0, 0, 0, 0.75));
		color: white;
		padding: 2rem 1rem 1rem;
		transform: translateY(100%);
		transition: transform 0.3s ease;
	}

	.gallery-item:hover .gallery-caption {
		transform: translateY(0);
	}

	.gallery-caption p {
		margin: 0 0 0.5rem 0;
		font-size: var(--font-size-40, 0.95rem);
	}

	.gallery-caption small {
		opacity: 0.8;
		font-size: var(--font-size-30, 0.8rem);
	}

	/* Lightbox */
	.lightbox {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.9);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.lightbox-content {
		position: relative;
		max-width: 90%;
		max-height: 90%;
	}

	.lightbox-content img {
		width: 100%;
		height: auto;
		max-height: 80vh;
		object-fit: contain;
	}

	.lightbox-close {
		position: absolute;
		top: -50px;
		right: 0;
		background: none;
		border: none;
		color: white;
		font-size: 2rem;
		cursor: pointer;
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.lightbox-nav {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		background: rgba(0, 0, 0, 0.5);
		border: none;
		color: white;
		font-size: 2.5rem;
		cursor: pointer;
		width: 48px;
		height: 48px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.lightbox-prev {
		left: -60px;
	}

	.lightbox-next {
		right: -60px;
	}

	.lightbox-caption {
		margin-top: 1rem;
		color: white;
		text-align: center;
	}

	.lightbox-caption small {
		display: block;
		opacity: 0.75;
		margin-top: 0.35rem;
	}
</style>
