'use client';

import { useState } from 'react';

const STEPS = [
  {
    number: 1,
    title: 'Install the TUI',
    description: 'Clone the repo and install the TUI. Requires Node.js 18 or later.',
    commands: [
      { label: 'clone', code: 'git clone https://github.com/vatistasdimitris01/shady.git' },
      { label: 'install', code: 'cd shady/apps/tui && npm install' },
      { label: 'link', code: 'npm link' },
    ],
    note: 'After npm link, the "shady" command is available globally. You can also run it directly with: npx tsx src/cli.tsx',
  },
  {
    number: 2,
    title: 'Start the Receiver',
    description: 'Run shady in your terminal. A QR code and pairing code will appear.',
    commands: [
      { label: 'start', code: 'shady' },
      { label: 'offline mode', code: 'shady --offline' },
      { label: 'custom name', code: 'shady --name "My Computer"' },
    ],
    note: 'The receiver registers itself with the discovery service and starts waiting for connections.',
  },
  {
    number: 3,
    title: 'Open the Web App on Your Phone',
    description: 'On the sending device, open this website. Your computer should appear in the Nearby Receivers list.',
    commands: [
      { label: 'url', code: 'https://shady-app.vercel.app' },
    ],
    note: 'Both devices must be on the same network for nearby discovery to work. Alternatively, scan the QR code from the terminal.',
  },
  {
    number: 4,
    title: 'Approve the Connection',
    description: 'When someone tries to connect, a pairing request appears in your terminal. A 6-digit code is shown on both devices.',
    commands: [],
    note: 'Verify that the code on your phone matches the code in your terminal. Press A to accept, R to reject.',
  },
  {
    number: 5,
    title: 'Send Files',
    description: 'Once approved, a direct WebRTC connection is established. Drop files in the browser — they transfer straight to your computer.',
    commands: [],
    note: 'Files are encrypted end-to-end. Nothing passes through any server. Transfer speed is limited only by your local network.',
  },
  {
    number: 6,
    title: 'Files Are Saved',
    description: 'Received files are verified with SHA-256 and saved to ~/Downloads/SHADY by default.',
    commands: [
      { label: 'default path', code: '~/Downloads/SHADY' },
      { label: 'custom path', code: 'shady --output /path/to/folder' },
    ],
    note: 'Check the Activity log in the TUI for transfer status. Incomplete transfers can be resumed.',
  },
];

const OS_INSTRUCTIONS = [
  {
    os: 'macOS',
    icon: '',
    install: 'brew install node && git clone https://github.com/vatistasdimitris01/shady.git && cd shady/apps/tui && npm install && npm link',
    run: 'shady',
  },
  {
    os: 'Linux',
    icon: '',
    install: 'curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt install -y nodejs && git clone https://github.com/vatistasdimitris01/shady.git && cd shady/apps/tui && npm install && sudo npm link',
    run: 'shady',
  },
  {
    os: 'Windows',
    icon: '',
    install: 'Download Node.js from nodejs.org, then: git clone https://github.com/vatistasdimitris01/shady.git && cd shady\\apps\\tui && npm install && npm link',
    run: 'shady',
  },
];

export default function SetupPage() {
  const [activeOS, setActiveOS] = useState(0);
  const [copied, setCopied] = useState('');

  const copyCommand = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8 sm:py-12">
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-4xl font-bold text-shady-accent mb-2">Setup Guide</h1>
        <p className="text-shady-muted text-sm sm:text-lg">Get running in under 2 minutes.</p>
      </div>

      <div className="bg-shady-surface border border-shady-border rounded-xl p-4 sm:p-6 mb-6">
        <h2 className="text-xs sm:text-sm font-bold text-shady-accent mb-3 uppercase tracking-wider">Quick Install</h2>
        <div className="flex gap-2 mb-4">
          {OS_INSTRUCTIONS.map((o, i) => (
            <button
              key={o.os}
              onClick={() => setActiveOS(i)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                activeOS === i
                  ? 'bg-shady-accent text-shady-bg'
                  : 'bg-shady-bg border border-shady-border text-shady-muted hover:text-shady-text'
              }`}
            >
              {o.os}
            </button>
          ))}
        </div>
        <div className="bg-shady-bg border border-shady-border rounded-lg p-4">
          <p className="text-xs text-shady-muted mb-2">Install</p>
          <div className="flex items-center justify-between mb-3">
            <code className="text-shady-accent text-sm break-all">{OS_INSTRUCTIONS[activeOS].install}</code>
            <button
              onClick={() => copyCommand(OS_INSTRUCTIONS[activeOS].install)}
              className="ml-3 text-shady-muted hover:text-shady-accent text-xs shrink-0"
            >
              {copied === OS_INSTRUCTIONS[activeOS].install ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p className="text-xs text-shady-muted mb-2">Run</p>
          <div className="flex items-center justify-between">
            <code className="text-shady-accent text-sm">{OS_INSTRUCTIONS[activeOS].run}</code>
            <button
              onClick={() => copyCommand(OS_INSTRUCTIONS[activeOS].run)}
              className="ml-3 text-shady-muted hover:text-shady-accent text-xs shrink-0"
            >
              {copied === OS_INSTRUCTIONS[activeOS].run ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      </div>

      {/* Step by step */}
      <div className="space-y-6 mb-12">
        {STEPS.map((step) => (
          <div key={step.number} className="bg-shady-surface border border-shady-border rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-10 h-10 bg-shady-accent text-shady-bg rounded-full flex items-center justify-center font-bold text-lg">
                {step.number}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-1">{step.title}</h3>
                <p className="text-shady-muted text-sm mb-3">{step.description}</p>

                {step.commands.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {step.commands.map((cmd) => (
                      <div key={cmd.label} className="bg-shady-bg border border-shady-border rounded-lg px-4 py-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-shady-muted uppercase w-16">{cmd.label}</span>
                          <code className="text-shady-accent text-sm">{cmd.code}</code>
                        </div>
                        <button
                          onClick={() => copyCommand(cmd.code)}
                          className="text-shady-muted hover:text-shady-accent text-xs"
                        >
                          {copied === cmd.code ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {step.note && (
                  <p className="text-shady-muted text-xs italic">{step.note}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Keyboard shortcuts */}
      <div className="bg-shady-surface border border-shady-border rounded-xl p-4 sm:p-6 mb-6">
        <h2 className="text-xs sm:text-sm font-bold text-shady-accent mb-3 uppercase tracking-wider">Keyboard Shortcuts</h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs sm:text-sm">
          {[
            ['A', 'Accept connection', 'green'],
            ['R', 'Reject connection', 'red'],
            ['Q', 'Refresh QR code', 'yellow'],
            ['Ctrl+C', 'Quit', 'red'],
          ].map(([key, desc, color]) => (
            <div key={key as string} className="flex items-center gap-2 py-1">
              <kbd className={`bg-shady-bg border border-shady-border rounded px-2 py-0.5 text-xs font-mono font-bold text-${color} w-14 text-center shrink-0`}>
                {key}
              </kbd>
              <span className="text-shady-muted">{desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Troubleshooting */}
      <div className="bg-shady-surface border border-shady-border rounded-xl p-6 mb-8">
        <h2 className="text-sm font-bold text-shady-accent mb-4 uppercase tracking-wider">Troubleshooting</h2>
        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-bold mb-1">Receiver not showing up</h3>
            <p className="text-shady-muted">Make sure both devices are on the same Wi-Fi network. If using a VPN, disconnect it — VPNs block local discovery.</p>
          </div>
          <div>
            <h3 className="font-bold mb-1">QR code not scanning</h3>
            <p className="text-shady-muted">Ensure the terminal supports QR codes. Most modern terminals do. Try the manual pairing code instead.</p>
          </div>
          <div>
            <h3 className="font-bold mb-1">Connection fails after approval</h3>
            <p className="text-shady-muted">Your network may be blocking WebRTC. Try offline mode: run shady --offline on the same Wi-Fi.</p>
          </div>
          <div>
            <h3 className="font-bold mb-1">Transfer is slow</h3>
            <p className="text-shady-muted">Check your Wi-Fi signal. For best speed, use a wired connection or 5 GHz Wi-Fi. Large files are chunked at 256 KiB.</p>
          </div>
          <div>
            <h3 className="font-bold mb-1">Run diagnostics</h3>
            <p className="text-shady-muted">Press D in the TUI to run network diagnostics and see what&apos;s working.</p>
          </div>
        </div>
      </div>

      {/* Security note */}
      <div className="bg-shady-surface border border-shady-accent/20 rounded-xl p-6 text-center">
        <p className="text-shady-muted text-sm">
          SHADY transfers are end-to-end encrypted via WebRTC DTLS. Files never pass through any server.
          Read the{' '}
          <a href="/security" className="text-shady-accent hover:underline">security model</a>
          {' '}for details.
        </p>
      </div>
    </div>
  );
}
