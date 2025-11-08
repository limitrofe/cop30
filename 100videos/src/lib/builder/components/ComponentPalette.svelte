<script>
	import { listComponentsByCategory } from '$lib/builder/component-registry.js';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();
	const categories = listComponentsByCategory();
	const entries = Object.entries(categories);

	const handleDragStart = (event, component) => {
		event.dataTransfer.setData('application/x-builder-component', component.type);
		event.dataTransfer.effectAllowed = 'copy';
	};

	const handleAddClick = (component) => {
		dispatch('add', { type: component.type });
	};
</script>

<div class="palette-wrapper">
	<div class="palette-scroll">
		{#each entries as [category, components]}
			<section class="category">
				<header>
					<h3>{category}</h3>
				</header>
				<div class="components">
					{#each components as component}
						<button
							class="component-card"
							draggable
							on:dragstart={(event) => handleDragStart(event, component)}
							on:click={() => handleAddClick(component)}
							title={component.description}
						>
							<span class="icon">{component.icon}</span>
							<div class="info">
								<strong>{component.label}</strong>
								<small>{component.description}</small>
							</div>
						</button>
					{/each}
				</div>
			</section>
		{/each}
	</div>
</div>

<style>
	.palette-wrapper {
		padding: 1.5rem;
		height: 100%;
		box-sizing: border-box;
	}

	.palette-scroll {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		padding-right: 0.25rem;
		height: 100%;
	}

	.category {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		background: rgba(255, 255, 255, 0.9);
		border-radius: 16px;
		padding: 1rem;
		box-shadow: 0 14px 32px rgba(15, 23, 42, 0.14);
		border: 1px solid rgba(226, 232, 240, 0.7);
	}

	.category header h3 {
		font-size: 0.9rem;
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.components {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.75rem;
	}

	.component-card {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.4rem;
		padding: 0.8rem 0.7rem;
		border: 1px solid #e2e8f0;
		border-radius: 12px;
		background: rgba(255, 255, 255, 0.95);
		box-shadow: 0 12px 30px -20px rgba(15, 23, 42, 0.35);
		cursor: grab;
		transition:
			transform 0.15s ease,
			box-shadow 0.15s ease;
		text-align: left;
	}

	.component-card:active {
		cursor: grabbing;
	}

	.component-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 18px rgba(15, 23, 42, 0.08);
	}

	.icon {
		font-size: 1.5rem;
	}

	.info {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.info strong {
		font-size: 0.88rem;
		color: #0f172a;
	}

	.info small {
		font-size: 0.72rem;
		color: #64748b;
		line-height: 1.25;
	}

	@media (max-width: 1200px) {
		.components {
			grid-template-columns: 1fr;
		}
	}
</style>
