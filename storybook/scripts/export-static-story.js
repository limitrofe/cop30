#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const buildDir = path.join(root, 'build');
const exportsDir = path.join(root, 'exports');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const zipName = `story-build-${timestamp}.zip`;
const zipPath = path.join(exportsDir, zipName);

try {
	console.log('🛠️  Gerando build estático...');
	execSync('npm run build', { stdio: 'inherit' });

	mkdirSync(exportsDir, { recursive: true });
	console.log('📦 Compactando build em', zipPath);
	execSync(`zip -r ${JSON.stringify(zipPath)} build`, { stdio: 'inherit' });

	console.log('\n✅ Export concluído! Arquivo disponível em:', zipPath);
} catch (error) {
	console.error('\n❌ Falha ao gerar export estático.');
	console.error(error.message || error);
	process.exitCode = 1;
}
