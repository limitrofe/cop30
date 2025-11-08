<!-- src/lib/components/story/ScrollyFramesAdapter.svelte -->
<script>
	import ScrollyFrames from '$lib/components/story/ScrollyFramesStable.svelte';

	// Props no formato ANTIGO (Docs)
	export let type = 'scrollyframes';
	export let text = ''; // título opcional (não exibido)
	export let frameStart = 1;
	export let frameStop = null;
	export let imagePrefix = '';
	export let imageSuffix = '.jpg';
	export let imagePrefixMobile = '';
	export let imageSuffixMobile = '.webp';
	export let framePadding = 4;
	export let height = '400vh';

	// Campos antigos não usados (mapeados/ignorados)
	export let showProgress = true;
	export let showTime = false; // ignorado
	export let preloadFrames = 4; // → preloadRadius
	export let memoryLimit = 50; // → maxMemoryMB
	export let animationSpeed = 0.1; // ignorado
	export let smoothing = true; // ignorado
	export let debug = false; // ignorado
	export let steps = []; // ignorado

	// Derivações
	$: startFrame = Number(frameStart) || 1;
	$: endFrame = frameStop != null ? Number(frameStop) : null;

	$: framePrefix = imagePrefix || '';
	$: framePrefixMobile = imagePrefixMobile || '';
	$: frameExtension = imageSuffix || '.jpg';
	$: frameExtensionMobile = imageSuffixMobile || '.webp';

	$: preloadRadius = Number(preloadFrames) || 4;
	$: maxMemoryMB = Number(memoryLimit) || 50;
</script>

<ScrollyFrames
	{framePrefix}
	{framePrefixMobile}
	{frameExtension}
	{frameExtensionMobile}
	{framePadding}
	{startFrame}
	{endFrame}
	{height}
	{preloadRadius}
	{maxMemoryMB}
	{showProgress}
	keepRadius={8}
	dprCap={2}
	throttleMs={16}
/>
