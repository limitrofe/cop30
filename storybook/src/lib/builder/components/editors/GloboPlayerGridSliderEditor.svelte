<script>
	import { createEventDispatcher } from 'svelte';

	export let value = [];

	const dispatch = createEventDispatcher();
	const MIN_SLIDES = 1;
	const MAX_SLIDES = 8;
	const MAX_VIDEOS_PER_SLIDE = 12;

	const aspectOptions = [
		{ value: '16 / 9', label: '16:9 (horizontal)' },
		{ value: '9 / 16', label: '9:16 (vertical)' }
	];

	const spanOptions = [
		{ value: 12, label: '100% (12/12)' },
		{ value: 9, label: '75% (9/12)' },
		{ value: 8, label: '66% (8/12)' },
		{ value: 6, label: '50% (6/12)' },
		{ value: 4, label: '33% (4/12)' },
		{ value: 3, label: '25% (3/12)' }
	];

	const createId = () => `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;

	const buildVideo = () => ({
		__internalId: createId(),
		title: '',
		videoIdDesktop: '',
		videoIdMobile: '',
		videoId: '',
		caption: '',
		credit: '',
		autoPlay: false,
		startMuted: true,
		showCaption: true,
		backgroundColor: '',
		spanDesktop: null,
		spanTablet: null,
		spanMobile: null,
		aspectRatio: '16 / 9',
		aspectRatioMobile: '9 / 16'
	});

	const buildSlide = () => ({
		__internalId: createId(),
		title: '',
		description: '',
		backgroundColor: '',
		gapDesktop: '',
		gapMobile: '',
		paddingDesktop: '',
		paddingMobile: '',
		videos: [buildVideo()]
	});

	let slides = [];
	let isUpdating = false;

	function ensureSlides(list) {
		const safe = Array.isArray(list) ? [...list] : [];
		if (safe.length === 0) safe.push(buildSlide());
		return safe.slice(0, MAX_SLIDES);
	}

	function normalizeIncoming(list) {
		const safe = ensureSlides(list).map((slide) => {
			const videos = Array.isArray(slide.videos) ? slide.videos : [];
			return {
				...buildSlide(),
				...slide,
				videos: videos
					.filter(Boolean)
					.slice(0, MAX_VIDEOS_PER_SLIDE)
					.map((video) => ({
						...buildVideo(),
						...video
					}))
			};
		});
		return safe;
	}

	$: if (!isUpdating) {
		slides = normalizeIncoming(value);
	}

	function emit(updated) {
		isUpdating = true;
		dispatch('change', { value: updated });
		Promise.resolve().then(() => {
			isUpdating = false;
		});
	}

	function addSlide() {
		if (slides.length >= MAX_SLIDES) return;
		const updated = [...slides, buildSlide()];
		slides = updated;
		emit(updated);
	}

	function duplicateSlide(index) {
		if (slides.length >= MAX_SLIDES) return;
		const clone = JSON.parse(JSON.stringify(slides[index]));
		clone.__internalId = createId();
		clone.videos = clone.videos.map((video) => ({
			...video,
			__internalId: createId()
		}));
		const updated = [...slides];
		updated.splice(index + 1, 0, clone);
		slides = updated.slice(0, MAX_SLIDES);
		emit(slides);
	}

	function removeSlide(index) {
		if (slides.length <= MIN_SLIDES) return;
		const updated = slides.filter((_, i) => i !== index);
		slides = ensureSlides(updated);
		emit(slides);
	}

	function moveSlide(index, direction) {
		const target = index + direction;
		if (target < 0 || target >= slides.length) return;
		const updated = [...slides];
		const [entry] = updated.splice(index, 1);
		updated.splice(target, 0, entry);
		slides = updated;
		emit(updated);
	}

	function updateSlide(index, key, value) {
		const updated = slides.map((slide, i) => (i === index ? { ...slide, [key]: value } : slide));
		slides = updated;
		emit(updated);
	}

	function addVideo(slideIndex) {
		const target = slides[slideIndex];
		if (!target || target.videos.length >= MAX_VIDEOS_PER_SLIDE) return;
		const updated = slides.map((slide, i) =>
			i === slideIndex ? { ...slide, videos: [...slide.videos, buildVideo()] } : slide
		);
		slides = updated;
		emit(updated);
	}

	function duplicateVideo(slideIndex, videoIndex) {
		const target = slides[slideIndex];
		if (!target || target.videos.length >= MAX_VIDEOS_PER_SLIDE) return;
		const clone = JSON.parse(JSON.stringify(target.videos[videoIndex]));
		clone.__internalId = createId();
		const updated = slides.map((slide, i) => {
			if (i !== slideIndex) return slide;
			const videos = [...slide.videos];
			videos.splice(videoIndex + 1, 0, clone);
			return { ...slide, videos: videos.slice(0, MAX_VIDEOS_PER_SLIDE) };
		});
		slides = updated;
		emit(updated);
	}

	function removeVideo(slideIndex, videoIndex) {
		const updated = slides.map((slide, i) => {
			if (i !== slideIndex) return slide;
			if (slide.videos.length <= 1) return slide;
			return {
				...slide,
				videos: slide.videos.filter((_, idx) => idx !== videoIndex)
			};
		});
		slides = updated;
		emit(updated);
	}

	function moveVideo(slideIndex, videoIndex, direction) {
		const target = slides[slideIndex];
		if (!target) return;
		const destination = videoIndex + direction;
		if (destination < 0 || destination >= target.videos.length) return;
		const videos = [...target.videos];
		const [entry] = videos.splice(videoIndex, 1);
		videos.splice(destination, 0, entry);
		const updated = slides.map((slide, i) => (i === slideIndex ? { ...slide, videos } : slide));
		slides = updated;
		emit(updated);
	}

	function updateVideo(slideIndex, videoIndex, key, val) {
		const updated = slides.map((slide, i) => {
			if (i !== slideIndex) return slide;
			const videos = slide.videos.map((video, idx) => {
				if (idx !== videoIndex) return video;
				if (key.startsWith('span')) {
					if (val === '') {
						return { ...video, [key]: null };
					}
					const parsed = Number(val);
					return {
						...video,
						[key]: Number.isFinite(parsed) && parsed > 0 ? parsed : video[key]
					};
				}
				return { ...video, [key]: val };
			});
			return { ...slide, videos };
		});
		slides = updated;
		emit(updated);
	}
</script>

<div class="grid-slider-editor">
	{#each slides as slide, slideIndex}
		<article class="slide-card">
			<header>
				<div class="summary">
					<strong>Slide {slideIndex + 1}</strong>
					<span>{slide.title || `${slide.videos.length} vídeo(s)`}</span>
				</div>
				<div class="actions">
					<button
						type="button"
						on:click={() => moveSlide(slideIndex, -1)}
						disabled={slideIndex === 0}
						title="Mover para cima">↑</button
					>
					<button
						type="button"
						on:click={() => moveSlide(slideIndex, +1)}
						disabled={slideIndex === slides.length - 1}
						title="Mover para baixo">↓</button
					>
					<button
						type="button"
						on:click={() => duplicateSlide(slideIndex)}
						disabled={slides.length >= MAX_SLIDES}
						title="Duplicar slide">⧉</button
					>
					<button
						type="button"
						class="danger"
						on:click={() => removeSlide(slideIndex)}
						disabled={slides.length <= MIN_SLIDES}
						title="Remover slide">✕</button
					>
				</div>
			</header>

			<section class="fields">
				<label>
					<span>Título do slide</span>
					<input
						type="text"
						value={slide.title}
						placeholder="Ex.: Bastidores"
						on:input={(event) => updateSlide(slideIndex, 'title', event.currentTarget.value)}
					/>
				</label>
				<label>
					<span>Descrição</span>
					<textarea
						rows="2"
						value={slide.description}
						placeholder="Descrição opcional"
						on:input={(event) => updateSlide(slideIndex, 'description', event.currentTarget.value)}
					></textarea>
				</label>
				<div class="grid">
					<label>
						<span>Cor de fundo</span>
						<input
							type="text"
							value={slide.backgroundColor}
							placeholder="#000000 ou rgba()"
							on:input={(event) =>
								updateSlide(slideIndex, 'backgroundColor', event.currentTarget.value)}
						/>
					</label>
					<label>
						<span>Espaçamento horizontal (desktop)</span>
						<input
							type="text"
							value={slide.gapDesktop}
							placeholder="1.5rem"
							on:input={(event) => updateSlide(slideIndex, 'gapDesktop', event.currentTarget.value)}
						/>
					</label>
					<label>
						<span>Espaçamento horizontal (mobile)</span>
						<input
							type="text"
							value={slide.gapMobile}
							placeholder="1rem"
							on:input={(event) => updateSlide(slideIndex, 'gapMobile', event.currentTarget.value)}
						/>
					</label>
					<label>
						<span>Padding (desktop)</span>
						<input
							type="text"
							value={slide.paddingDesktop}
							placeholder="1.5rem 0"
							on:input={(event) =>
								updateSlide(slideIndex, 'paddingDesktop', event.currentTarget.value)}
						/>
					</label>
					<label>
						<span>Padding (mobile)</span>
						<input
							type="text"
							value={slide.paddingMobile}
							placeholder="1rem 0"
							on:input={(event) =>
								updateSlide(slideIndex, 'paddingMobile', event.currentTarget.value)}
						/>
					</label>
				</div>
			</section>

			<section class="videos">
				<header>
					<h4>Vídeos ({slide.videos.length})</h4>
					<button
						type="button"
						on:click={() => addVideo(slideIndex)}
						disabled={slide.videos.length >= MAX_VIDEOS_PER_SLIDE}>+ Adicionar vídeo</button
					>
				</header>

				{#each slide.videos as video, videoIndex}
					<div class="video-card">
						<header>
							<div>
								<strong>Vídeo {videoIndex + 1}</strong>
								<span
									>{video.title ||
										video.videoIdDesktop ||
										video.videoIdMobile ||
										'Sem identificação'}</span
								>
							</div>
							<div class="actions">
								<button
									type="button"
									on:click={() => moveVideo(slideIndex, videoIndex, -1)}
									disabled={videoIndex === 0}
									title="Mover para cima">↑</button
								>
								<button
									type="button"
									on:click={() => moveVideo(slideIndex, videoIndex, +1)}
									disabled={videoIndex === slide.videos.length - 1}
									title="Mover para baixo">↓</button
								>
								<button
									type="button"
									on:click={() => duplicateVideo(slideIndex, videoIndex)}
									disabled={slide.videos.length >= MAX_VIDEOS_PER_SLIDE}
									title="Duplicar vídeo">⧉</button
								>
								<button
									type="button"
									class="danger"
									on:click={() => removeVideo(slideIndex, videoIndex)}
									disabled={slide.videos.length <= 1}
									title="Remover vídeo">✕</button
								>
							</div>
						</header>

						<div class="grid">
							<label>
								<span>Título</span>
								<input
									type="text"
									value={video.title}
									placeholder="Título opcional"
									on:input={(event) =>
										updateVideo(slideIndex, videoIndex, 'title', event.currentTarget.value)}
								/>
							</label>
							<label>
								<span>ID desktop</span>
								<input
									type="text"
									value={video.videoIdDesktop}
									placeholder="Ex.: 123456"
									on:input={(event) =>
										updateVideo(
											slideIndex,
											videoIndex,
											'videoIdDesktop',
											event.currentTarget.value
										)}
								/>
							</label>
							<label>
								<span>ID mobile</span>
								<input
									type="text"
									value={video.videoIdMobile}
									placeholder="Ex.: 123456"
									on:input={(event) =>
										updateVideo(slideIndex, videoIndex, 'videoIdMobile', event.currentTarget.value)}
								/>
							</label>
							<label>
								<span>ID fallback</span>
								<input
									type="text"
									value={video.videoId}
									placeholder="Utilizado se desktop/mobile vazios"
									on:input={(event) =>
										updateVideo(slideIndex, videoIndex, 'videoId', event.currentTarget.value)}
								/>
							</label>
						</div>

						<div class="grid">
							<label>
								<span>Aspect ratio (desktop)</span>
								<select
									value={video.aspectRatio}
									on:change={(event) =>
										updateVideo(slideIndex, videoIndex, 'aspectRatio', event.currentTarget.value)}
								>
									{#each aspectOptions as option}
										<option value={option.value}>{option.label}</option>
									{/each}
								</select>
							</label>
							<label>
								<span>Aspect ratio (mobile)</span>
								<select
									value={video.aspectRatioMobile}
									on:change={(event) =>
										updateVideo(
											slideIndex,
											videoIndex,
											'aspectRatioMobile',
											event.currentTarget.value
										)}
								>
									{#each aspectOptions as option}
										<option value={option.value}>{option.label}</option>
									{/each}
								</select>
							</label>
							<label>
								<span>Largura desktop</span>
								<select
									value={video.spanDesktop ?? ''}
									on:change={(event) =>
										updateVideo(slideIndex, videoIndex, 'spanDesktop', event.currentTarget.value)}
								>
									<option value="">Automático</option>
									{#each spanOptions as option}
										<option value={option.value}>{option.label}</option>
									{/each}
								</select>
							</label>
							<label>
								<span>Largura tablet</span>
								<select
									value={video.spanTablet ?? ''}
									on:change={(event) =>
										updateVideo(slideIndex, videoIndex, 'spanTablet', event.currentTarget.value)}
								>
									<option value="">Automático</option>
									{#each spanOptions as option}
										<option value={option.value}>{option.label}</option>
									{/each}
								</select>
							</label>
							<label>
								<span>Largura mobile</span>
								<select
									value={video.spanMobile ?? ''}
									on:change={(event) =>
										updateVideo(slideIndex, videoIndex, 'spanMobile', event.currentTarget.value)}
								>
									<option value="">Automático</option>
									{#each spanOptions as option}
										<option value={option.value}>{option.label}</option>
									{/each}
								</select>
							</label>
						</div>

						<div class="grid">
							<label>
								<span>Legenda</span>
								<input
									type="text"
									value={video.caption}
									placeholder="Legenda exibida no player"
									on:input={(event) =>
										updateVideo(slideIndex, videoIndex, 'caption', event.currentTarget.value)}
								/>
							</label>
							<label>
								<span>Crédito</span>
								<input
									type="text"
									value={video.credit}
									placeholder="Crédito"
									on:input={(event) =>
										updateVideo(slideIndex, videoIndex, 'credit', event.currentTarget.value)}
								/>
							</label>
							<label>
								<span>Fundo do player</span>
								<input
									type="text"
									value={video.backgroundColor}
									placeholder="Ex.: #000 ou transparent"
									on:input={(event) =>
										updateVideo(
											slideIndex,
											videoIndex,
											'backgroundColor',
											event.currentTarget.value
										)}
								/>
							</label>
						</div>

						<div class="toggles">
							<label
								><input
									type="checkbox"
									checked={video.autoPlay}
									on:change={(event) =>
										updateVideo(slideIndex, videoIndex, 'autoPlay', event.currentTarget.checked)}
								/> Autoplay</label
							>
							<label
								><input
									type="checkbox"
									checked={video.startMuted}
									on:change={(event) =>
										updateVideo(slideIndex, videoIndex, 'startMuted', event.currentTarget.checked)}
								/> Iniciar sem áudio</label
							>
							<label
								><input
									type="checkbox"
									checked={video.showCaption}
									on:change={(event) =>
										updateVideo(slideIndex, videoIndex, 'showCaption', event.currentTarget.checked)}
								/> Mostrar legenda/crédito</label
							>
						</div>
					</div>
				{/each}
			</section>
		</article>
	{/each}

	<button
		type="button"
		class="add-slide"
		on:click={addSlide}
		disabled={slides.length >= MAX_SLIDES}
	>
		+ Adicionar slide
	</button>
</div>

<style>
	.grid-slider-editor {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.slide-card {
		border: 1px solid rgba(148, 163, 184, 0.4);
		border-radius: 12px;
		overflow: hidden;
		background: #ffffff;
		box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
		padding: 1rem 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.slide-card > header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
	}

	.slide-card .summary {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.slide-card .summary strong {
		font-size: 1rem;
	}

	.slide-card .summary span {
		font-size: 0.85rem;
		color: #475569;
	}

	.actions {
		display: flex;
		gap: 0.35rem;
	}

	.actions button {
		width: 32px;
		height: 32px;
		border-radius: 6px;
		border: 1px solid rgba(148, 163, 184, 0.45);
		background: #f8fafc;
		cursor: pointer;
		font-size: 0.85rem;
	}

	.actions button:hover:not(:disabled) {
		background: #e2e8f0;
	}

	.actions button:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	.actions button.danger {
		background: #fee2e2;
		border-color: #fecaca;
		color: #991b1b;
	}

	.fields,
	.videos {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.fields label,
	.video-card label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.8rem;
		color: #1e293b;
	}

	.fields input,
	.fields textarea,
	.video-card input,
	.video-card textarea,
	.video-card select {
		border: 1px solid rgba(148, 163, 184, 0.6);
		border-radius: 8px;
		padding: 0.45rem 0.6rem;
		font-size: 0.85rem;
		font-family: inherit;
		color: #0f172a;
	}

	.fields textarea,
	.video-card textarea {
		resize: vertical;
	}

	.grid {
		display: grid;
		gap: 0.75rem;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
	}

	.videos > header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.videos > header h4 {
		margin: 0;
		font-size: 0.95rem;
		color: #0f172a;
	}

	.videos > header button {
		border: 1px dashed rgba(59, 130, 246, 0.6);
		background: rgba(59, 130, 246, 0.1);
		color: #1d4ed8;
		border-radius: 8px;
		padding: 0.35rem 0.75rem;
		cursor: pointer;
		font-size: 0.85rem;
	}

	.videos > header button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.video-card {
		border: 1px solid rgba(148, 163, 184, 0.35);
		border-radius: 10px;
		padding: 0.85rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		background: #f8fafc;
	}

	.video-card > header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.video-card > header strong {
		font-size: 0.9rem;
		color: #0f172a;
	}

	.video-card > header span {
		font-size: 0.75rem;
		color: #475569;
	}

	.toggles {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		font-size: 0.8rem;
	}

	.toggles label {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
	}

	.add-slide {
		align-self: flex-start;
		border: 1px dashed rgba(59, 130, 246, 0.6);
		background: rgba(59, 130, 246, 0.08);
		color: #1d4ed8;
		padding: 0.45rem 1rem;
		border-radius: 8px;
		font-size: 0.9rem;
		cursor: pointer;
	}

	.add-slide:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
