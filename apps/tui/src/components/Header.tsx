import React from 'react';
import { Box, Text } from 'ink';

interface HeaderProps {
  displayName: string;
  isConnected: boolean;
  offline: boolean;
}

export const Header: React.FC<HeaderProps> = ({ displayName, isConnected, offline }) => {
  const statusColor = offline ? 'yellow' : isConnected ? 'green' : 'red';
  const statusText = offline ? 'Local Only' : isConnected ? 'Online' : 'Offline';

  return (
    <Box flexDirection="column" alignItems="center" marginBottom={1}>
      <Text bold color="green">SHADY</Text>
      <Text dimColor>A suspiciously fast local drop.</Text>
      <Box marginTop={1}>
        <Text><Text bold>{displayName}</Text></Text>
        <Text> · </Text>
        <Text color={statusColor}>{statusText}</Text>
      </Box>
    </Box>
  );
};
