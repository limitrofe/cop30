<!-- src/lib/components/builder/controls/DeviceToggle.svelte -->
<script>
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	export let value = 'desktop';
	export let size = 'normal'; // 'small', 'normal', 'large'
	export let variant = 'default'; // 'default', 'compact'

	const deviceOptions = [
		{ id: 'mobile', icon: '📱', label: 'Mobile' },
		{ id: 'tablet', icon: '📲', label: 'Tablet' },
		{ id: 'desktop', icon: '💻', label: 'Desktop' },
		{ id: 'wide', icon: '🖥️', label: 'Wide' }
	];

	function handleChange(newValue) {
		value = newValue;
		dispatch('change', { value: newValue });
	}
</script>

<div class="device-toggle" class:compact={variant === 'compact'} class:size-{size}>
	{#each deviceOptions as option}
		<button
			class={`device-btn device-${option.id}`}
			class:active={value === option.id}
			on:click={() => handleChange(option.id)}
			title={`Configurações para ${option.label}`}
		>
			<span class="icon">{option.icon}</span>
			<span class="label">{option.label}</span>
		</button>
	{/each}
</div>

<style>
	.device-toggle {
		display: flex;
		background: #f1f5f9;
		border-radius: 8px;
		padding: 4px;
		gap: 2px;
	}

	.device-btn {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		border: none;
		background: transparent;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.875rem;
		font-weight: 500;
		color: #64748b;
		transition: all 0.2s ease;
	}

	.device-btn:hover {
		background: #e2e8f0;
		color: #475569;
	}

	.device-btn.active {
		background: #3182ce;
		color: white;
		box-shadow: 0 1px 3px rgba(49, 130, 206, 0.3);
	}

	.icon {
		font-size: 1rem;
	}

	.label {
		font-size: inherit;
	}

	/* Size variants */
	.size-small .device-btn {
		padding: 0.5rem 0.75rem;
		font-size: 0.75rem;
	}

	.size-small .icon {
		font-size: 0.875rem;
	}

	.size-large .device-btn {
		padding: 1rem 1.25rem;
		font-size: 1rem;
	}

	.size-large .icon {
		font-size: 1.25rem;
	}

	/* Compact variant */
	.compact .device-btn {
		padding: 0.5rem;
		min-width: 40px;
	}

	.compact .label {
		display: none;
	}

	.compact .icon {
		font-size: 1.125rem;
	}

	/* Responsive */
	@media (max-width: 640px) {
		.device-toggle:not(.compact) .label {
			display: none;
		}

		.device-toggle:not(.compact) .device-btn {
			padding: 0.75rem;
			min-width: 44px;
		}

		.device-toggle:not(.compact) .icon {
			font-size: 1.125rem;
		}
	}
</style>
