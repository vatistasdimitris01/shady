import React from 'react';
import { Box, Text } from 'ink';
import { PROTOCOL_VERSION } from '../types.js';

export const HelpScreen: React.FC = () => (
  <Box flexDirection="column" borderStyle="double" borderColor="cyan" padding={1}>
    <Box justifyContent="center" marginBottom={1}>
      <Text bold color="cyan">❓ SHADY HELP</Text>
    </Box>

    <Box flexDirection="column" marginBottom={1}>
      <Text bold color="green">Keyboard Shortcuts</Text>
      <Box marginTop={1} gap={4}>
        <Box flexDirection="column" width={28}>
          <Text><Text bold color="cyan">[S]</Text> Send a file</Text>
          <Text><Text bold color="cyan">[F]</Text> Send a folder</Text>
          <Text><Text bold color="cyan">[C]</Text> Send clipboard</Text>
          <Text><Text bold color="cyan">[A]</Text> Accept connection</Text>
          <Text><Text bold color="cyan">[R]</Text> Reject connection</Text>
          <Text><Text bold color="cyan">[N]</Text> Rename receiver</Text>
        </Box>
        <Box flexDirection="column" width={28}>
          <Text><Text bold color="yellow">[Q]</Text> Regenerate QR</Text>
          <Text><Text bold color="yellow">[O]</Text> Toggle mode</Text>
          <Text><Text bold color="yellow">[P]</Text> Pause transfer</Text>
          <Text><Text bold color="yellow">[X]</Text> Cancel transfer</Text>
          <Text><Text bold color="yellow">[D]</Text> Diagnostics</Text>
          <Text><Text bold color="red">[Ctrl+C]</Text> Exit safely</Text>
        </Box>
      </Box>
    </Box>

    <Box flexDirection="column" marginBottom={1}>
      <Text bold color="green">How It Works</Text>
      <Text dimColor marginTop={1}>1. SHADY starts a receiver on your computer</Text>
      <Text dimColor>2. A QR code and pairing code are generated</Text>
      <Text dimColor>3. Scan the QR or open the SHADY web app</Text>
      <Text dimColor>4. Approve the connection request</Text>
      <Text dimColor>5. Files transfer directly via WebRTC</Text>
      <Text dimColor>6. No files pass through any server</Text>
    </Box>

    <Box flexDirection="column" marginBottom={1}>
      <Text bold color="green">Security</Text>
      <Text dimColor marginTop={1}>• Ephemeral keys — no permanent identity</Text>
      <Text dimColor>• Manual approval required for all connections</Text>
      <Text dimColor>• One-time pairing secrets</Text>
      <Text dimColor>• End-to-end encrypted via WebRTC DTLS</Text>
      <Text dimColor>• SHA-256 file integrity verification</Text>
    </Box>

    <Box justifyContent="center" marginTop={1}>
      <Text color="gray" bold>[B]</Text><Text dimColor> Back</Text>
    </Box>
  </Box>
);
