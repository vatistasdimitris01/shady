import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import qrcode from 'qrcode-terminal';
import { formatDuration } from '../lib/crypto.js';

interface QRCodePanelProps {
  sessionId: string;
  secret: string;
  pairingCode: string;
  offline: boolean;
  expiresAt: number;
  onRefresh: () => void;
}

export const QRCodePanel: React.FC<QRCodePanelProps> = ({ sessionId, secret, pairingCode, offline, expiresAt, onRefresh }) => {
  const [qrOutput, setQrOutput] = useState('');
  const remaining = Math.max(0, expiresAt - Date.now());
  const baseUrl = offline ? 'http://localhost:8787' : 'https://shady-app.vercel.app';
  const url = `${baseUrl}/connect/${sessionId}#${secret}`;

  useEffect(() => {
    qrcode.generate(url, { small: true }, (qr) => setQrOutput(qr));
  }, [url]);

  useEffect(() => {
    if (remaining <= 0) onRefresh();
  }, [remaining, onRefresh]);

  return (
    <Box flexDirection="column" alignItems="center">
      <Text bold color="green">Scan</Text>
      <Box marginY={1}>
        <Text>{qrOutput}</Text>
      </Box>
      <Text>
        <Text bold>Code: </Text>
        <Text color="yellow" bold>{pairingCode}</Text>
      </Text>
      <Text dimColor>expires {formatDuration(remaining)}</Text>
    </Box>
  );
};
