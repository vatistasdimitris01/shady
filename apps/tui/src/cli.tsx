import React from 'react';
import { render } from 'ink';
import { ShadyApp } from './components/ShadyApp.js';

const args = process.argv.slice(2);

const helpText = `
SHADY — A suspiciously fast local drop.

Usage:
  shady                    Start the TUI receiver
  shady receive            Start the TUI receiver
  shady send <path>        Send a file
  shady send <path> --device <device>  Send to specific device
  shady clipboard          Send clipboard content
  shady devices            List nearby devices
  shady history            View transfer history
  shady resume             Resume incomplete transfers
  shady cleanup            Clean up incomplete transfers
  shady config             Open configuration
  shady doctor             Run network diagnostics
  shady --offline          Start in offline mode
  shady --hidden           Start hidden from discovery
  shady --qr-only          Start with QR-only visibility
  shady --version          Show version
  shady --help             Show this help
`;

if (args.includes('--help') || args.includes('-h')) {
  console.log(helpText);
  process.exit(0);
}

if (args.includes('--version') || args.includes('-v')) {
  console.log('SHADY v0.1.0');
  process.exit(0);
}

if (args[0] === 'send') {
  console.log('Send mode: use the web app to send files to this receiver.');
  process.exit(0);
}

if (args[0] === 'devices') {
  console.log('Open the SHADY web app to see nearby receivers.');
  process.exit(0);
}

if (args[0] === 'history') {
  console.log('Transfer history is shown in the TUI Activity log.');
  process.exit(0);
}

if (args[0] === 'resume') {
  console.log('Resume: open the TUI and check incomplete transfers.');
  process.exit(0);
}

if (args[0] === 'cleanup') {
  console.log('Cleanup: run "rm -rf ~/Downloads/SHADY/.shady-incomplete"');
  process.exit(0);
}

if (args[0] === 'config') {
  console.log('Config: edit ~/.config/shady/config.json');
  process.exit(0);
}

if (args[0] === 'doctor') {
  console.log('Running diagnostics in the TUI... press D in the TUI.');
  process.exit(0);
}

const offline = args.includes('--offline');

render(<ShadyApp offline={offline} />);
