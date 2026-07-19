import React from 'react';
import { Box, Text } from 'ink';
import { PROTOCOL_VERSION } from '../types.js';

export const AboutScreen: React.FC = () => (
  <Box flexDirection="column" borderStyle="double" borderColor="green" padding={1}>
    <Box justifyContent="center" marginBottom={1}>
      <Text bold color="green">ℹ️  ABOUT SHADY</Text>
    </Box>

    <Box flexDirection="column" alignItems="center" marginBottom={1}>
      <Text bold color="green">SHADY v0.1.0</Text>
      <Text dimColor italic>A suspiciously fast local drop.</Text>
      <Text dimColor marginTop={1}>Protocol: v{PROTOCOL_VERSION}</Text>
    </Box>

    <Box flexDirection="column" marginBottom={1}>
      <Text bold color="green">How It Works</Text>
      <Text dimColor marginTop={1}>SHADY lets any nearby browser send files directly to your terminal.</Text>
      <Text dimColor>Start the receiver, scan its QR code or find it on the SHADY web app,</Text>
      <Text dimColor>approve the connection, and transfer files peer-to-peer.</Text>
    </Box>

    <Box flexDirection="column" marginBottom={1}>
      <Text bold color="green">Architecture</Text>
      <Text dimColor marginTop={1}>• Vercel coordinates discovery and signaling</Text>
      <Text dimColor>• Files transfer directly between peers via WebRTC</Text>
      <Text dimColor>• No file contents pass through any server</Text>
      <Text dimColor>• End-to-end encrypted data channels</Text>
    </Box>

    <Box flexDirection="column" marginBottom={1}>
      <Text bold color="green">Honest Claims</Text>
      <Text dimColor marginTop={1}>• Vercel handles temporary presence and signaling</Text>
      <Text dimColor>• Direct peers may learn network-address information</Text>
      <Text dimColor>• Restrictive NAT/firewall may prevent WebRTC connections</Text>
      <Text dimColor>• Offline QR mode available for same-LAN transfers</Text>
    </Box>

    <Box flexDirection="column" marginBottom={1}>
      <Text bold color="green">License</Text>
      <Text dimColor marginTop={1}>MIT License</Text>
    </Box>

    <Box justifyContent="center" marginTop={1}>
      <Text color="gray" bold>[B]</Text><Text dimColor> Back</Text>
    </Box>
  </Box>
);
