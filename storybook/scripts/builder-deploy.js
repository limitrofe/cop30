#!/usr/bin/env node

// scripts/builder-deploy.js
// Gera o build e copia o resultado para uma pasta específica do projeto

import { execSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import PROJECT_CONFIG from '../project.config.js';

const __filename = fileURLToPath(import.meta.url);
const rootDir = path.join(path.dirname(__filename), '..');
const buildDir = path.join(rootDir, 'build');

function getOption(name, fallback = null) {
	const flagWithValue = process.argv.find((arg) => arg.startsWith(`--${name}=`));
	if (flagWithValue) {
		return flagWithValue.split('=').slice(1).join('=');
	}

	const flagIndex = process.argv.indexOf(`--${name}`);
	if (flagIndex !== -1 && process.argv.length > flagIndex + 1) {
		return process.argv[flagIndex + 1];
	}

	return fallback;
}

const destRootInput = getOption('dest') || getOption('target');
const projectName = getOption('project', PROJECT_CONFIG.projectName);
const skipBuild = process.argv.includes('--skip-build');

if (!destRootInput) {
	console.error(
		'❌ Uso: node scripts/builder-deploy.js --dest <pasta-destino> [--project <nome>] [--skip-build]'
	);
	process.exit(1);
}

const destRoot = path.isAbsolute(destRootInput)
	? destRootInput
	: path.resolve(rootDir, destRootInput);
const deployDir = path.join(destRoot, projectName);

async function ensureBuildDir() {
	try {
		await fs.access(buildDir);
	} catch {
		throw new Error('Pasta build/ não encontrada. Rode o build primeiro.');
	}
}

async function copyDirectory(src, dest) {
	await fs.mkdir(dest, { recursive: true });
	const entries = await fs.readdir(src, { withFileTypes: true });

	for (const entry of entries) {
		const srcPath = path.join(src, entry.name);
		const destPath = path.join(dest, entry.name);

		if (entry.isDirectory()) {
			await copyDirectory(srcPath, destPath);
		} else if (entry.isFile()) {
			await fs.copyFile(srcPath, destPath);
		} else if (entry.isSymbolicLink()) {
			const target = await fs.readlink(srcPath);
			await fs.symlink(target, destPath);
		}
	}
}

async function main() {
	try {
		console.log('🧱 Projeto:', projectName);
		console.log('📂 Destino base:', destRoot);

		if (!skipBuild) {
			console.log('\n🏗️  Rodando build...');
			execSync('npm run build', { stdio: 'inherit', cwd: rootDir });
		}

		await ensureBuildDir();

		console.log('\n🧹 Limpando destino anterior (se existir)...');
		await fs.rm(deployDir, { recursive: true, force: true });

		console.log('📦 Copiando build para o destino...');
		await copyDirectory(buildDir, deployDir);

		console.log('\n✅ Build copiado com sucesso!');
		console.log(`📁 Pasta final: ${deployDir}`);
		console.log(`🌐 Aponte seu servidor/hosting para essa pasta.`);
	} catch (error) {
		console.error('\n❌ Falha no processo:', error.message);
		process.exit(1);
	}
}

main();
