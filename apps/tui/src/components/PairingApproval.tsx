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
    <Box flexDirection="column" borderStyle="double" borderColor="yellow" padding={1} marginTop={1}>
      <Box justifyContent="center" marginBottom={1}>
        <Text bold color="yellow">INCOMING CONNECTION</Text>
      </Box>
      <Box flexDirection="column" alignItems="center">
        <Text><Text bold>{request.senderName}</Text> wants to connect</Text>
        <Text dimColor>{request.senderBrowser} on {request.senderOS}</Text>
        <Box marginTop={1}>
          <Text>Code: </Text>
          <Text color="yellow" bold>{request.pairingCode}</Text>
        </Box>
      </Box>
    </Box>
  );
};
