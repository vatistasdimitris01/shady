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
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-[320px]">
        <a href="/" className="text-zinc-700 text-xs hover:text-zinc-500 transition-colors mb-6 inline-block">← back</a>
        <h1 className="text-lg font-medium tracking-tight mb-1">setup</h1>
        <p className="text-zinc-500 text-xs mb-8">get running in 2 minutes</p>

        {/* Install */}
        <div className="mb-8">
          <div className="flex gap-1 mb-3">
            {OS.map((o, i) => (
              <button key={o.name} onClick={() => setOs(i)}
                className={`px-3 py-1 rounded text-[10px] font-medium transition-colors ${i === os ? 'bg-lime-400 text-zinc-950' : 'text-zinc-500 hover:text-zinc-300'}`}>
                {o.name}
              </button>
            ))}
          </div>
          <div className="bg-zinc-900 rounded-lg p-3 flex items-center justify-between">
            <code className="text-lime-400 text-[10px] font-mono break-all leading-relaxed pr-2">{OS[os].cmd}</code>
            <button onClick={() => copy(OS[os].cmd)} className="text-zinc-600 text-[10px] hover:text-zinc-400 shrink-0">
              {copied === OS[os].cmd ? 'copied' : 'copy'}
            </button>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-5 mb-8">
          {[
            { n: '1', t: 'install', d: 'clone the repo and link it globally' },
            { n: '2', t: 'run shady', d: 'a qr code appears in your terminal' },
            { n: '3', t: 'open this site', d: 'scan the qr or enter the pairing code' },
            { n: '4', t: 'approve', d: 'press A in the terminal to accept' },
            { n: '5', t: 'drop files', d: 'they transfer directly to your computer' },
          ].map(s => (
            <div key={s.n} className="flex gap-3">
              <span className="text-lime-400 text-xs font-mono mt-0.5">{s.n}</span>
              <div>
                <p className="text-xs font-medium">{s.t}</p>
                <p className="text-zinc-500 text-[10px]">{s.d}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Shortcuts */}
        <div className="mb-8">
          <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-2">shortcuts</p>
          <div className="grid grid-cols-2 gap-y-1">
            {[['A', 'accept'], ['R', 'reject'], ['Q', 'new qr'], ['Ctrl+C', 'quit']].map(([k, v]) => (
              <div key={k} className="flex items-center gap-2 text-[10px]">
                <kbd className="font-mono text-lime-400 w-10">{k}</kbd>
                <span className="text-zinc-500">{v}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-zinc-700 text-[10px] text-center">
          end-to-end encrypted · no files touch a server
        </p>
      </div>
    </div>
  );
}
