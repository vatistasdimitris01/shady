import React from 'react';
import { Box, Text } from 'ink';
import { formatDuration } from '../lib/crypto.js';

interface HeaderProps {
  displayName: string;
  isConnected: boolean;
  offline: boolean;
  sessionExpiresAt: number;
}

export const Header: React.FC<HeaderProps> = ({ displayName, isConnected, offline, sessionExpiresAt }) => {
  const remaining = Math.max(0, sessionExpiresAt - Date.now());
  const statusColor = offline ? 'yellow' : isConnected ? 'green' : 'red';
  const statusText = offline ? 'QR-Only' : isConnected ? 'Discoverable' : 'Offline';
  const modeText = offline ? 'Local Only' : 'Direct P2P';

  return (
    <Box flexDirection="column" alignItems="center" marginBottom={1}>
      <Text bold color="green">{'██████████████████████████████████████'}</Text>
      <Text bold color="green">{'██                                    ██'}</Text>
      <Text bold color="green">{'██   ███████╗██╗  ██╗ █████╗ ████████╗██'}</Text>
      <Text bold color="green">{'██   ██╔════╝██║  ██║██╔══██╗╚══██╔══╝██'}</Text>
      <Text bold color="green">{'██   ███████╗███████║███████║   ██║   ██'}</Text>
      <Text bold color="green">{'██   ╚════██║██╔══██║██╔══██║   ██║   ██'}</Text>
      <Text bold color="green">{'██   ███████║██║  ██║██║  ██║   ██║   ██'}</Text>
      <Text bold color="green">{'██   ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ██'}</Text>
      <Text bold color="green">{'██                                    ██'}</Text>
      <Text bold color="green">{'██████████████████████████████████████'}</Text>
      <Text dimColor italic>  A suspiciously fast local drop.</Text>
      <Box marginTop={1} justifyContent="center" gap={2}>
        <Text><Text bold>Receiver:</Text> <Text color="white">{displayName}</Text></Text>
        <Text>│</Text>
        <Text><Text bold>Status:</Text> <Text color={statusColor}>{statusText}</Text></Text>
        <Text>│</Text>
        <Text><Text bold>Mode:</Text> <Text color="cyan">{modeText}</Text></Text>
        <Text>│</Text>
        <Text><Text bold>Expires:</Text> <Text color="yellow">{formatDuration(remaining)}</Text></Text>
      </Box>
    </Box>
  );
};
