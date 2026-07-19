import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const DEFAULT_PORT = 53317;
const CHUNK_SIZE = 1024 * 1024;

export interface LocalServerInfo {
  ip: string;
  port: number;
}

function getLocalIp(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return '127.0.0.1';
}

export function startLocalServer(downloadDir: string): Promise<LocalServerInfo> {
  return new Promise((resolve, reject) => {
    const ip = getLocalIp();
    const dir = path.resolve(downloadDir);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const server = http.createServer(async (req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', '*');
      res.setHeader('Access-Control-Allow-Private-Network', 'true');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      if (req.method === 'POST') {
        const filename = path.basename(decodeURIComponent(req.headers['x-filename'] as string || 'unknown'));
        const filePath = path.join(dir, filename);

        try {
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(chunk);
          const buffer = Buffer.concat(chunks);
          fs.writeFileSync(filePath, buffer);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, bytes: buffer.length }));
        } catch (err: any) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: err.message }));
        }
        return;
      }

      res.writeHead(404);
      res.end('Not found');
    });

    server.listen(DEFAULT_PORT, '0.0.0.0', () => {
      resolve({ ip, port: DEFAULT_PORT });
    });

    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        server.listen(0, '0.0.0.0', () => {
          resolve({ ip, port: (server.address() as any).port });
        });
      } else {
        reject(err);
      }
    });
  });
}
