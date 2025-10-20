<!-- src/routes/builder/+page.svelte -->
<script>
	import BuilderShell from '$lib/builder/components/BuilderShell.svelte';
</script>

<svelte:head>
	<title>Story Builder Viewer</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
	<link
		href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<BuilderShell />

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: 'Inter', system-ui, sans-serif;
	}
</style>
