import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import qrcode from 'qrcode-terminal';
import { formatDuration } from '../lib/crypto.js';

interface QRCodePanelProps {
  sessionId: string;
  secret: string;
  pairingCode: string;
  offline: boolean;
  port?: number;
  expiresAt: number;
  onRefresh: () => void;
}

export const QRCodePanel: React.FC<QRCodePanelProps> = ({ sessionId, secret, pairingCode, offline, port, expiresAt, onRefresh }) => {
  const [qrOutput, setQrOutput] = useState('');
  const remaining = Math.max(0, expiresAt - Date.now());
  const baseUrl = offline ? `http://localhost:${port || 8787}` : 'https://shady-app.vercel.app';
  const url = `${baseUrl}/connect/${sessionId}#${secret}`;

  useEffect(() => {
    qrcode.generate(url, { small: true }, (qr) => setQrOutput(qr));
  }, [url]);

  useEffect(() => {
    if (remaining <= 0) onRefresh();
  }, [remaining, onRefresh]);

  return (
    <Box flexDirection="column" alignItems="center" borderStyle="round" borderColor="green" padding={1}>
      <Text bold color="green">
        {offline ? '⚡ OFFLINE MODE — Local Network Only' : '📱 SCAN TO CONNECT'}
      </Text>
      <Box marginY={1}>
        <Text>{qrOutput}</Text>
      </Box>
      <Text bold>
        <Text color="yellow">Pairing code: </Text>
        <Text color="yellow" bold>{pairingCode}</Text>
      </Text>
      <Text dimColor>QR expires in {formatDuration(remaining)}</Text>
      <Text dimColor marginTop={1}>Open the SHADY web app or scan with your camera</Text>
      {offline && (
        <Text color="yellow" dimColor marginTop={1}>
          URL: {url}
        </Text>
      )}
    </Box>
  );
};
