import React from 'react';
import { render } from 'ink';
import { ShadyApp } from './components/ShadyApp.js';

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
  SHADY — A suspiciously fast local drop.

  Usage:
    shady                Start the receiver
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

const offline = args.includes('--offline');
render(<ShadyApp offline={offline} />);
