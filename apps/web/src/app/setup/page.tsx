'use client';

import { useState } from 'react';

const OS = [
  { name: 'macOS', cmd: 'brew install node && git clone https://github.com/vatistasdimitris01/shady.git && cd shady/apps/tui && npm install && npm link' },
  { name: 'Linux', cmd: 'curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt install -y nodejs && git clone https://github.com/vatistasdimitris01/shady.git && cd shady/apps/tui && npm install && sudo npm link' },
  { name: 'Windows', cmd: 'git clone https://github.com/vatistasdimitris01/shady.git && cd shady\\apps\\tui && npm install && npm link' },
];

export default function SetupPage() {
  const [os, setOs] = useState(0);
  const [copied, setCopied] = useState('');

  const copy = (t: string) => { navigator.clipboard.writeText(t); setCopied(t); setTimeout(() => setCopied(''), 1500); };

  return (
    <div className="min-h-dvh flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-sm">
        <a href="/" className="text-xs text-gray-400 hover:text-gray-600 mb-6 inline-block">back</a>
        <h1 className="text-lg font-medium mb-1">Setup</h1>
        <p className="text-sm text-gray-400 mb-8">Get running in two minutes</p>

        <div className="mb-8">
          <div className="flex gap-1 mb-3">
            {OS.map((o, i) => (
              <button key={o.name} onClick={() => setOs(i)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${i === os ? 'bg-gray-900 text-white' : 'text-gray-400 hover:text-gray-600'}`}>
                {o.name}
              </button>
            ))}
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-2">
            <code className="text-xs font-mono text-gray-700 break-all">{OS[os].cmd}</code>
            <button onClick={() => copy(OS[os].cmd)} className="text-xs text-gray-400 hover:text-gray-600 shrink-0">
              {copied === OS[os].cmd ? 'copied' : 'copy'}
            </button>
          </div>
        </div>

        <div className="space-y-5 mb-8">
          {[
            { n: '1', t: 'Install', d: 'clone the repo and link it globally' },
            { n: '2', t: 'Run shady', d: 'a QR code appears in your terminal' },
            { n: '3', t: 'Open this site', d: 'scan the QR or enter the pairing code' },
            { n: '4', t: 'Approve', d: 'press A in the terminal to accept' },
            { n: '5', t: 'Drop files', d: 'they transfer directly to your computer' },
          ].map(s => (
            <div key={s.n} className="flex gap-3">
              <span className="text-blue-500 text-sm font-mono mt-0.5">{s.n}</span>
              <div>
                <p className="text-sm font-medium">{s.t}</p>
                <p className="text-xs text-gray-400">{s.d}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-8">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Shortcuts</p>
          <div className="grid grid-cols-2 gap-y-1">
            {[['A', 'accept'], ['R', 'reject'], ['Q', 'new QR'], ['Ctrl+C', 'quit']].map(([k, v]) => (
              <div key={k} className="flex items-center gap-2 text-xs">
                <kbd className="font-mono text-blue-500 w-10">{k}</kbd>
                <span className="text-gray-400">{v}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-300 text-center">
          end-to-end encrypted · no files touch a server
        </p>
      </div>
    </div>
  );
}
