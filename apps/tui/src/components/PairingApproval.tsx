import React from 'react';
import { Box, Text } from 'ink';
import type { PairingRequest } from '../types.js';

interface PairingApprovalProps {
  request: PairingRequest;
  onAccept: () => void;
  onReject: () => void;
}

export const PairingApproval: React.FC<PairingApprovalProps> = ({ request, onAccept, onReject }) => {
  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="yellow">Incoming</Text>
      </Box>
      <Box flexDirection="column">
        <Text><Text bold>{request.senderName}</Text> wants to connect</Text>
        <Text dimColor>{request.senderBrowser} · {request.senderOS}</Text>
        <Box marginTop={1}>
          <Text bold>Code: </Text>
          <Text color="yellow" bold>{request.pairingCode}</Text>
        </Box>
      </Box>
    </Box>
  );
};
