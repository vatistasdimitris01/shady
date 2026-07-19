import React from 'react';
import { Box, Text } from 'ink';
import { formatBytes, formatSpeed } from '../lib/crypto.js';
import type { ActiveTransfer } from '../types.js';

interface TransferProgressProps {
  transfers: ActiveTransfer[];
}

const FileBar: React.FC<{ file: ActiveTransfer['files'][0] }> = ({ file }) => {
  const pct = file.totalChunks > 0 ? Math.round((file.receivedChunks / file.totalChunks) * 100) : 0;
  const barW = 30;
  const filled = Math.round((pct / 100) * barW);
  const bar = '█'.repeat(filled) + '░'.repeat(barW - filled);
  const statusColor = { pending: 'gray', transferring: 'cyan', paused: 'yellow', completed: 'green', failed: 'red', cancelled: 'red' }[file.status] as string;
  const eta = file.speed > 0 ? `${Math.ceil(((file.size - file.size * pct / 100) / file.speed))}s` : '--';

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box justifyContent="space-between">
        <Text color="white">{file.name}</Text>
        <Text color={statusColor}>{pct}%</Text>
      </Box>
      <Box>
        <Text color="green">{bar}</Text>
        <Text> </Text>
        <Text dimColor>{formatBytes(file.size * pct / 100)} / {formatBytes(file.size)}</Text>
        <Text> </Text>
        <Text color="cyan">{formatSpeed(file.speed)}</Text>
        <Text> </Text>
        <Text dimColor>ETA {eta}</Text>
      </Box>
    </Box>
  );
};

export const TransferProgress: React.FC<TransferProgressProps> = ({ transfers }) => {
  if (transfers.length === 0) {
    return (
      <Box borderStyle="round" borderColor="cyan" padding={1}>
        <Text dimColor>No active transfers</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="cyan" padding={1}>
      <Text bold color="cyan">📤 Active Transfers ({transfers.length})</Text>
      <Box marginTop={1} flexDirection="column">
        {transfers.map((s) => (
          <Box key={s.id} flexDirection="column">
            <Text dimColor>From: {s.senderName}</Text>
            {s.files.map((f) => <FileBar key={f.id} file={f} />)}
          </Box>
        ))}
      </Box>
    </Box>
  );
};
