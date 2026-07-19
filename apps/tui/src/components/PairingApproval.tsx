import React from 'react';
import { Box, Text } from 'ink';
import type { PairingRequest } from '../types.js';

interface PairingApprovalProps {
  request: PairingRequest;
  onAccept: () => void;
  onReject: () => void;
  onBlock: () => void;
}

const DEVICE_ICONS: Record<string, string> = {
  desktop: '🖥️',
  laptop: '💻',
  phone: '📱',
  tablet: '📲',
  unknown: '❓',
};

export const PairingApproval: React.FC<PairingApprovalProps> = ({ request, onAccept, onReject, onBlock }) => {
  const icon = DEVICE_ICONS[request.senderDeviceType] || '❓';
  const timeSince = Math.floor((Date.now() - request.timestamp) / 1000);
  const requestTime = timeSince < 60 ? `${timeSince}s ago` : `${Math.floor(timeSince / 60)}m ago`;

  return (
    <Box flexDirection="column" borderStyle="double" borderColor="yellow" padding={1} marginTop={1}>
      <Box justifyContent="center" marginBottom={1}>
        <Text bold color="yellow">🔔 INCOMING CONNECTION REQUEST</Text>
      </Box>
      <Box flexDirection="column" alignItems="center" marginBottom={1}>
        <Text>{icon} <Text bold color="white">{request.senderName}</Text> wants to connect</Text>
        <Text dimColor>{request.senderBrowser} on {request.senderOS}</Text>
        <Text dimColor>Requested {requestTime}</Text>
      </Box>
      <Box flexDirection="column" alignItems="center" marginBottom={1}>
        <Text>
          <Text bold>Pairing code: </Text>
          <Text color="yellow" bold>{request.pairingCode}</Text>
        </Text>
        <Text dimColor>Confirm this matches the code on the sender&apos;s screen</Text>
      </Box>
      <Box justifyContent="center" marginTop={1}>
        <Text><Text color="green" bold>[A]</Text><Text> Accept</Text></Text>
        <Text>  </Text>
        <Text><Text color="red" bold>[R]</Text><Text> Reject</Text></Text>
        <Text>  </Text>
        <Text><Text color="gray" bold>[B]</Text><Text> Block</Text></Text>
      </Box>
    </Box>
  );
};
