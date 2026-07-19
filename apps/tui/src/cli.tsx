import React from 'react';
import { render } from 'ink';
import { ShadyApp } from './components/ShadyApp.js';
import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { existsSync } from 'fs';

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
  SHADY — A suspiciously fast local drop.

  Usage:
    shady                Start the receiver
    shady update         Update to latest version
    shady --offline      Local network only (no cloud)
    shady --version      Show version
    shady --help         Show this help
  `);
  process.exit(0);
}

if (args.includes('--version') || args.includes('-v')) {
  console.log('shady v0.1.0');
  process.exit(0);
}

if (args[0] === 'update') {
  console.log('Checking for updates...\n');

  // Find the shady repo root by walking up from this file's location
  let dir = resolve(dirname(new URL(import.meta.url).pathname), '..', '..', '..');

  // If we're in a npm-linked global install, find the real source
  if (!existsSync(resolve(dir, '.git'))) {
    // Try common locations
    const candidates = [
      resolve(process.env.HOME || '~', 'shady'),
      resolve(process.env.HOME || '~', 'projects', 'shady'),
      resolve('/opt/homebrew/lib/node_modules/@shady/tui/../..'),
    ];
    for (const c of candidates) {
      if (existsSync(resolve(c, '.git'))) { dir = c; break; }
    }
  }

  if (!existsSync(resolve(dir, '.git'))) {
    console.error('Could not find shady repository.');
    console.error('Reinstall instead:');
    console.error('  git clone https://github.com/vatistasdimitris01/shady.git');
    process.exit(1);
  }

  console.log(`Repository: ${dir}`);

  try {
    const current = execSync('git rev-parse --short HEAD', { cwd: dir, encoding: 'utf-8' }).trim();
    console.log(`Current:    ${current}`);

    execSync('git fetch origin main', { cwd: dir, stdio: 'pipe' });
    const latest = execSync('git rev-parse --short origin/main', { cwd: dir, encoding: 'utf-8' }).trim();
    console.log(`Latest:     ${latest}`);

    if (current === latest) {
      console.log('\nAlready up to date.');
      process.exit(0);
    }

    console.log('\nUpdating...');
    execSync('git pull origin main', { cwd: dir, stdio: 'pipe' });
    console.log('✓ Code updated');

    execSync('npm install', { cwd: resolve(dir, 'apps', 'tui'), stdio: 'pipe' });
    console.log('✓ Dependencies updated');

    console.log(`\nUpdated ${current} → ${latest}. Restart shady to use the new version.`);
  } catch (err: any) {
    console.error(`\nUpdate failed: ${err.message}`);
    console.error('Try manually: cd ~/shady && git pull && cd apps/tui && npm install');
    process.exit(1);
  }

  process.exit(0);
}

const offline = args.includes('--offline');
render(<ShadyApp offline={offline} />);
