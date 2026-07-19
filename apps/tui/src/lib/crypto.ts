import { randomBytes, createHash } from 'crypto';
import { nanoid } from 'nanoid';

export function generateDeviceId(): string {
  return `shady-${nanoid(12)}`;
}

export function generateSessionId(): string {
  return nanoid(21);
}

export function generatePairingCode(): string {
  const code = randomBytes(3).readUIntBE(0, 3) % 1000000;
  const formatted = code.toString().padStart(6, '0');
  return `${formatted.slice(0, 3)} ${formatted.slice(3)}`;
}

export function generateQrSecret(): string {
  return randomBytes(32).toString('hex');
}

export function detectDeviceType(): string {
  return 'laptop';
}

export function detectOS(): string {
  const platform = process.platform;
  if (platform === 'darwin') return 'macOS';
  if (platform === 'linux') return 'Linux';
  if (platform === 'win32') return 'Windows';
  return 'Unknown';
}

export function generateDisplayName(): string {
  const adjectives = [
    'Roasted', 'Blue', 'Red', 'Golden', 'Silver', 'Brave', 'Cosmic', 'Dancing', 'Electric', 'Flying',
    'Ghostly', 'Hidden', 'Icy', 'Jolly', 'Kind', 'Lucky', 'Mighty', 'Neon', 'Odd', 'Pink',
    'Quiet', 'Royal', 'Shiny', 'Tiny', 'Ultra', 'Vivid', 'Wild', 'Xeno', 'Young', 'Zany',
    'Ancient', 'Bouncy', 'Chilly', 'Deep', 'Eager', 'Fancy', 'Gentle', 'Happy', 'Ink', 'Jade',
    'Keen', 'Lazy', 'Magic', 'Noble', 'Old', 'Pure', 'Quick', 'Rough', 'Soft', 'Tough',
    'Loud', 'Smooth', 'Bold', 'Calm', 'Dandy', 'Elite', 'Frost', 'Grand', 'Holy', 'Iron',
    'Silent', 'Swift', 'Thin', 'Vast', 'Warm', 'Crisp', 'Dawn', 'Edge', 'Flame', 'Glow',
    'Haze', 'Jet', 'Kaleido', 'Lunar', 'Mist', 'Nova', 'Onyx', 'Pearl', 'Quartz', 'Ruby',
    'Steel', 'Topaz', 'Umbra', 'Vibe', 'Wave', 'Zephyr', 'Amber', 'Blaze', 'Copper', 'Drift',
  ];
  const nouns = [
    'Car', 'Whale', 'Tiger', 'Eagle', 'Fox', 'Wolf', 'Bear', 'Hawk', 'Lion', 'Deer',
    'Owl', 'Falcon', 'Panda', 'Koala', 'Viper', 'Lynx', 'Dragon', 'Phoenix', 'Raven', 'Shark',
    'Cobra', 'Crane', 'Dolphin', 'Elk', 'Gecko', 'Hare', 'Ibex', 'Jaguar', 'Kite', 'Lark',
    'Moth', 'Newt', 'Otter', 'Puma', 'Quail', 'Roan', 'Skunk', 'Toad', 'Urchin', 'Vole',
    'Wren', 'Yak', 'Zebra', 'Beetle', 'Coral', 'Drift', 'Ember', 'Flint', 'Grove', 'Horn',
    'Ivory', 'Jade', 'Kelp', 'Lobe', 'Moss', 'Nest', 'Orbit', 'Petal', 'Quill', 'Reef',
    'Sable', 'Tusk', 'Urn', 'Vale', 'Wisp', 'Yarn', 'Zeal', 'Bloom', 'Crest', 'Dune',
    'Fjord', 'Glen', 'Heath', 'Isle', 'Knoll', 'Ledge', 'Mesa', 'Nook', 'Oasis', 'Peak',
  ];
  const a = adjectives[Math.floor(Math.random() * adjectives.length)];
  const n = nouns[Math.floor(Math.random() * nouns.length)];
  return `${a} ${n}`;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function formatSpeed(bytesPerSecond: number): string {
  return `${formatBytes(bytesPerSecond)}/s`;
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
}

export function hashContent(data: Buffer | string): string {
  return createHash('sha256').update(data).digest('hex');
}

export function sanitizeFileName(name: string): string {
  return name
    .replace(/\.\./g, '')
    .replace(/^\//, '')
    .replace(/^\\/, '')
    .replace(/^[A-Z]:\\/, '')
    .replace(/\0/g, '')
    .replace(/[<>:"|?*]/g, '_')
    .replace(/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i, '_$1')
    .trim();
}
