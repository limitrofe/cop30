<script>
	import { createEventDispatcher } from 'svelte';
	import FreeCanvasEditorImpl from '$lib/components/builder/editors/FreeCanvasEditor.svelte';

	export let data;

	const dispatch = createEventDispatcher();

	function handleUpdate(event) {
		dispatch('update', event.detail ?? data);
	}
</script>

<FreeCanvasEditorImpl bind:data on:update={handleUpdate} />
