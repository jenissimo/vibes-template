#!/usr/bin/env node

import { rmSync, existsSync } from 'fs';
import { join } from 'path';

const cacheDirs = [
  'node_modules/.vite',
  'node_modules/.cache',
  'dist',
  '.svelte-kit'
];

console.log('🧹 Clearing cache directories...');

cacheDirs.forEach(dir => {
  const fullPath = join(process.cwd(), dir);
  if (existsSync(fullPath)) {
    try {
      rmSync(fullPath, { recursive: true, force: true });
      console.log(`✅ Cleared: ${dir}`);
    } catch (error) {
      console.warn(`⚠️ Failed to clear ${dir}:`, error.message);
    }
  } else {
    console.log(`ℹ️ Not found: ${dir}`);
  }
});

console.log('🎉 Cache clearing complete!');
