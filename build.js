#!/usr/bin/env bun

import { build } from 'bun';

console.log('🏗️  Building TVWS Library...');

// Clean dist directory
await Bun.$`rm -rf dist`.catch(() => {});
await Bun.$`mkdir -p dist`.catch(() => {});

// Build ESM format
console.log('📦 Building ESM format...');
await build({
  entrypoints: ['src/index.ts'],
  outdir: 'dist',
  target: 'browser',
  format: 'esm',
  minify: true,
  sourcemap: false,
  naming: '[name].js'
});

// Build UMD format
console.log('📦 Building UMD format...');
await build({
  entrypoints: ['src/index.ts'],
  outdir: 'dist',
  target: 'browser',
  format: 'iife',
  globalName: 'tvws',
  minify: true,
  sourcemap: false,
  naming: '[name].umd.js'
});

// Build CJS format
console.log('📦 Building CJS format...');
await build({
  entrypoints: ['src/index.ts'],
  outdir: 'dist',
  target: 'node',
  format: 'cjs',
  minify: true,
  sourcemap: false,
  naming: '[name].cjs'
});

// Build TypeScript definitions
console.log('📝 Building TypeScript definitions...');
await Bun.$`bunx tsc --emitDeclarationOnly`.catch(console.error);

console.log('✅ Build completed!');
await Bun.$`ls -la dist/`.catch(console.error);
