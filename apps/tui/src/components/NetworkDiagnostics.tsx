import React from 'react';
import { Box, Text } from 'ink';

interface DiagnosticCheck { name: string; status: 'ok' | 'warning' | 'error' | 'checking'; message?: string; }

const CHECKS: DiagnosticCheck[] = [
  { name: 'Internet', status: 'ok', message: 'Connected' },
  { name: 'Discovery Service', status: 'checking', message: 'Checking...' },
  { name: 'WebSocket', status: 'ok', message: 'Connected' },
  { name: 'STUN', status: 'ok', message: 'Available' },
  { name: 'LAN Address', status: 'ok', message: '192.168.x.x' },
  { name: 'WebRTC', status: 'ok', message: 'Supported' },
  { name: 'Protocol', status: 'ok', message: 'v1.0.0' },
  { name: 'Clock Sync', status: 'ok', message: 'In sync' },
  { name: 'QR Support', status: 'ok', message: 'Terminal compatible' },
];

const ICONS: Record<string, string> = { ok: '✓', warning: '!', error: '✗', checking: '...' };
const COLORS: Record<string, string> = { ok: 'green', warning: 'yellow', error: 'red', checking: 'cyan' };

export const NetworkDiagnostics: React.FC = () => (
  <Box flexDirection="column" borderStyle="round" borderColor="blue" padding={1}>
    <Box justifyContent="center" marginBottom={1}>
      <Text bold color="blue">🔧 Network Diagnostics</Text>
    </Box>
    <Box flexDirection="column">
      {CHECKS.map((c) => (
        <Box key={c.name} justifyContent="space-between">
          <Text><Text color={COLORS[c.status]}>{ICONS[c.status]}</Text> {c.name}</Text>
          <Text color={COLORS[c.status]}>{c.message}</Text>
        </Box>
      ))}
    </Box>
    <Box justifyContent="center" marginTop={1}>
      <Text color="cyan" bold>[R]</Text><Text dimColor> Refresh</Text>
      <Text>  </Text>
      <Text color="gray" bold>[B]</Text><Text dimColor> Back</Text>
    </Box>
  </Box>
);
