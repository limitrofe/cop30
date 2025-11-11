// scripts/chumbar-links-FINAL.js
// SCRIPT FINAL. SEM FRESCURA. FORÇA BRUTA PARA CHUMBAR TODOS OS LINKS.

import fs from 'fs/promises';
import path from 'path';

// O único link que existe no universo a partir de agora.
const URL_FIXA =
	'https://s3.glbimg.com/v1/AUTH_e03f7a1106bb438e970511f892f07c35/g1/a-trama-do-golpe';
const buildDir = path.resolve(process.cwd(), 'build');

async function resolverEssaPorra() {
	console.log('🔥 EXECUTANDO SCRIPT FINAL NA FORÇA BRUTA 🔥');
	console.log(`- Alvo: ${buildDir}`);
	console.log(`- URL Chumbada: ${URL_FIXA}`);

	try {
		const files = await fs.readdir(buildDir, { recursive: true });

		for (const file of files) {
			const filePath = path.join(buildDir, file);
			if ((await fs.stat(filePath)).isDirectory()) continue;

			// Processa os únicos arquivos que importam: JS, CSS, HTML.
			if (!/\.(js|css|html)$/.test(file)) continue;

			console.log(`- 🔨 Forçando links em: ${file}`);
			let content = await fs.readFile(filePath, 'utf8');
			const originalContent = content;

			// REGRA 1: Mata o `base` dinâmico no index.html.
			content = content.replace(
				/base: new URL\(".", location\)\.pathname\.slice\(0, -1\)/g,
				`base: "${URL_FIXA}"`
			);

			// REGRA 2: Acha QUALQUER link relativo (./ ou ../) e substitui pela URL completa.
			// Ex: href="./_app/..." -> href="https://s3.glbimg.com/.../_app/..."
			content = content.replace(/(href|src)="\.\//g, `$1="${URL_FIXA}/`);

			// REGRA 3: Acha QUALQUER import relativo em JS e conserta.
			// Ex: from"../chunks/..." -> from "https://s3.glbimg.com/.../_app/immutable/chunks/..."
			content = content.replace(/from"\.\.\/chunks\//g, `from"${URL_FIXA}/_app/immutable/chunks/`);
			content = content.replace(
				/import\("\.\.\/nodes\//g,
				`import("${URL_FIXA}/_app/immutable/nodes/`
			);

			// REGRA 4: Conserta URLs em CSS
			content = content.replace(/url\(\.\.\//g, `url(${URL_FIXA}/_app/immutable/`);

			if (content !== originalContent) {
				await fs.writeFile(filePath, content, 'utf8');
				console.log('   ✅ Links chumbados na marra.');
			}
		}
		console.log('\n✅ TUDO PRONTO. Se isso não funcionar, nada mais funciona.');
	} catch (error) {
		console.error('\n❌ DEU MERDA NO SCRIPT FINAL:', error);
	}
}

resolverEssaPorra();
