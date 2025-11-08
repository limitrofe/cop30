// src/lib/components/builder/editors/index.js
export { default as FreeCanvasEditor } from './FreeCanvasEditor.svelte';
export { default as SimpleEditor } from './SimpleEditor.svelte';
export { default as GenericEditor } from './SimpleEditor.svelte'; // Alias

// Função helper para obter editor específico
export function getEditor(componentType) {
	switch (componentType) {
		case 'free-canvas':
			return import('./FreeCanvasEditor.svelte').then((m) => m.default);
		case 'header':
		case 'text':
			return import('./SimpleEditor.svelte').then((m) => m.default);
		default:
			return import('./SimpleEditor.svelte').then((m) => m.default);
	}
}
