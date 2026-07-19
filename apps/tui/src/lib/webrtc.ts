import * as nd from 'node-datachannel';
import * as fs from 'fs';
import * as path from 'path';

type SignalFn = (type: string, payload: unknown) => void;
type LogFn = (type: 'info' | 'success' | 'warning' | 'error', msg: string) => void;

let pc: nd.PeerConnection | null = null;
let dc: nd.DataChannel | null = null;
let downloadDir = '';
let receiveBuffer: Map<string, { chunks: Buffer[]; total: number; received: number; name: string }> = new Map();

export function setupWebRTC(
  sdp: string,
  dir: string,
  sendSignal: SignalFn,
  addLog: LogFn,
): void {
  downloadDir = dir;
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  pc = new nd.PeerConnection('0.0.0.0', {
    iceServers: ['stun:stun.l.google.com:19302'],
  });

  pc.onLocalDescription((sdp: string, type: string) => {
    sendSignal(type === 'Offer' ? 'offer' : 'answer', { sdp, type });
  });

  pc.onLocalCandidate((candidate: string, mid: string) => {
    sendSignal('ice-candidate', { candidate, mid });
  });

  pc.onDataChannel((channel: nd.DataChannel) => {
    dc = channel;
    channel.onMessage((msg: string | ArrayBuffer) => {
      if (typeof msg === 'string') {
        try {
          const p = JSON.parse(msg);
          if (p.type === 'manifest') {
            addLog('info', `Receiving ${p.files?.length || 1} file(s)...`);
            for (const f of p.files || []) {
              receiveBuffer.set(f.fileId, { chunks: [], total: 0, received: 0, name: f.name });
            }
          } else if (p.type === 'complete') {
            addLog('success', `Transfer complete`);
          }
        } catch {}
      } else {
        const buf = Buffer.from(msg);
        const hdrLen = buf.readUInt32BE(0);
        const hdr = JSON.parse(buf.subarray(4, 4 + hdrLen).toString());
        const data = buf.subarray(4 + hdrLen);
        if (hdr.t === 't0' && hdr.f && hdr.n) {
          let entry = receiveBuffer.get(hdr.f);
          if (!entry) {
            entry = { chunks: new Array(hdr.n), total: hdr.n, received: 0, name: hdr.f };
            receiveBuffer.set(hdr.f, entry);
          }
          entry.chunks[hdr.c] = data;
          entry.received++;
          if (entry.received === entry.total) {
            const outPath = path.join(downloadDir, entry.name.replace(/\.\./g, '').replace(/[<>:"|?*]/g, '_'));
            const full = Buffer.concat(entry.chunks);
            fs.writeFileSync(outPath, full);
            receiveBuffer.delete(hdr.f);
            addLog('success', `Saved: ${entry.name}`);
          }
        }
      }
    });
  });

  pc.setRemoteDescription(sdp, 'Offer');
  try {
    pc.setLocalDescription('', {});
  } catch (e) {
    addLog('error', `WebRTC answer failed`);
  }
}

export function handleIceCandidate(candidate: string, mid: string): void {
  if (pc) pc.addRemoteCandidate(candidate, mid);
}

export function closeWebRTC(): void {
  if (dc) { try { dc.close(); } catch {} dc = null; }
  if (pc) { try { pc.destroy(); } catch {} pc = null; }
  receiveBuffer.clear();
}
