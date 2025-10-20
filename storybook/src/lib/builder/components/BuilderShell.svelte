<script>
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import Toolbar from './Toolbar.svelte';
	import ComponentPalette from './ComponentPalette.svelte';
	import Canvas from './Canvas.svelte';
	import Inspector from './Inspector.svelte';
	import { loadStoryFromServer } from '../story-service.js';
	import { storyStore, selectedBlockId, storyParagraphs } from '../stores/storyStore.js';

	let workspaceMode = 'content';

	onMount(() => {
		loadStoryFromServer();
	});

	const handleAddComponent = (event) => {
		const { type, position } = event.detail;
		if (!type) return;
		let insertPosition = typeof position === 'number' ? position : null;

		if (insertPosition === null) {
			const currentId = get(selectedBlockId);
			if (currentId) {
				const blocks = get(storyParagraphs);
				const currentIndex = blocks.findIndex((block) => block.__id === currentId);
				if (currentIndex !== -1) {
					insertPosition = currentIndex + 1;
				}
			}
		}

		const block = storyStore.addBlock(type, insertPosition);
		if (block) {
			selectedBlockId.set(block.__id);
		}
	};

	const handleModeChange = (event) => {
		workspaceMode = event.detail.mode;
	};
</script>

<div class="builder-shell">
	<Toolbar mode={workspaceMode} on:changeMode={handleModeChange} />
	<div class="workspace">
		<aside class="sidebar">
			<ComponentPalette on:add={handleAddComponent} />
		</aside>
		<Canvas mode={workspaceMode} on:modeChange={handleModeChange} on:add={handleAddComponent} />
		<aside class="inspector-pane">
			<Inspector />
		</aside>
	</div>
</div>

<style>
	.builder-shell {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background: #f1f5f9;
	}

	.workspace {
		flex: 1;
		display: grid;
		grid-template-columns: 320px minmax(0, 1fr) 380px;
		gap: 1px;
		background: #e2e8f0;
		min-height: 0;
		overflow: hidden;
	}

	.sidebar {
		border-right: 1px solid #dbe2f3;
		background: linear-gradient(
			210deg,
			rgba(255, 255, 255, 0.92) 0%,
			rgba(241, 245, 249, 0.9) 100%
		);
		display: flex;
		flex-direction: column;
		min-height: 0;
		overflow: hidden;
	}

	.sidebar :global(.palette-wrapper) {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
	}

	.inspector-pane {
		border-left: 1px solid #dbe2f3;
		background: linear-gradient(200deg, #f8fafc 0%, #eef2ff 100%);
		display: flex;
		flex-direction: column;
		min-height: 0;
		overflow: hidden;
	}

	.inspector-pane :global(.inspector) {
		flex: 1;
		min-height: 0;
	}
</style>
