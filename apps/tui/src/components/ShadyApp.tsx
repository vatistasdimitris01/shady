import React, { useState } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import TextInput from 'ink-text-input';
import { QRCodePanel } from './QRCodePanel.js';
import { ActivityLog } from './ActivityLog.js';
import { useShadyState } from '../hooks/useShadyState.js';

interface ShadyAppProps {
  offline: boolean;
}

export const ShadyApp: React.FC<ShadyAppProps> = ({ offline }) => {
  const { exit } = useApp();
  const state = useShadyState(offline);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsPath, setSettingsPath] = useState(state.downloadDir);

  useInput((input, key) => {
    if (showSettings) {
      if (key.escape) { setShowSettings(false); setSettingsPath(state.downloadDir); }
      return;
    }
    if (key.ctrl && input === 'c') { exit(); return; }
    if (state.pendingRequest) {
      if (input === 'a' || input === 'A') state.approveRequest();
      if (input === 'r' || input === 'R') state.rejectRequest();
    }
    if (input === 'q' || input === 'Q') state.refreshQr();
    if (input === 's' || input === 'S') { setSettingsPath(state.downloadDir); setShowSettings(true); }
  });

  const doneSettings = () => {
    state.setDownloadDir(settingsPath);
    state.addLog('info', `Download dir: ${settingsPath}`);
    setShowSettings(false);
  };

  if (showSettings) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text bold>Settings</Text>
        <Text dimColor>Download folder:</Text>
        <Box marginY={1}><TextInput value={settingsPath} onChange={setSettingsPath} onSubmit={doneSettings} /></Box>
        <Text dimColor>Enter save  Escape cancel</Text>
      </Box>
    );
  }

  const statusColor = offline ? 'yellow' : state.isConnected ? 'green' : 'red';
  const statusText = offline ? 'Local' : state.isConnected ? 'Online' : 'Offline';

  return (
    <Box flexDirection="column" padding={1}>
      <Box>
        <Text><Text bold>SHADY</Text><Text dimColor> · </Text><Text bold>{state.displayName}</Text><Text dimColor> · </Text><Text color={statusColor}>{statusText}</Text></Text>
      </Box>
      <Box flexDirection="row" marginTop={1}>
        <Box flexDirection="column">
          <QRCodePanel
            sessionId={state.identity.sessionId}
            secret={state.qrSecret}
            pairingCode={state.pairingCode}
            offline={offline}
            expiresAt={state.sessionExpiresAt}
            onRefresh={state.refreshQr}
          />
        </Box>
        <Box flexDirection="column" flexGrow={1} paddingLeft={2}>
          {state.pendingRequest ? (
            <Box flexDirection="column">
              <Text bold color="yellow">Incoming</Text>
              <Text><Text bold>{state.pendingRequest.senderName}</Text> wants to connect</Text>
              <Text dimColor>{state.pendingRequest.senderBrowser} · {state.pendingRequest.senderOS}</Text>
              <Box marginTop={1}>
                <Text bold>Code: </Text><Text color="yellow" bold>{state.pendingRequest.pairingCode}</Text>
              </Box>
              <Box marginTop={1}>
                <Text><Text color="green" bold>[A]</Text><Text> Accept</Text></Text>
                <Text>  </Text>
                <Text><Text color="red" bold>[R]</Text><Text> Reject</Text></Text>
              </Box>
            </Box>
          ) : state.nearbyDevices.length > 0 ? (
            <Box flexDirection="column">
              <Text bold color="blue">Nearby</Text>
              <Box flexDirection="column">
                {state.nearbyDevices.slice(0, 4).map((d: any) => (
                  <Text key={d.deviceId}>
                    <Text color="green">●</Text> {d.displayName} <Text dimColor>{d.os}</Text>
                  </Text>
                ))}
              </Box>
            </Box>
          ) : (
            <Text dimColor>Waiting...</Text>
          )}
        </Box>
      </Box>
      <ActivityLog entries={state.logs} maxEntries={3} />
      <Box marginTop={1}>
        <Text><Text color="yellow" bold>[Q]</Text><Text> QR</Text></Text>
        <Text>  </Text>
        <Text><Text color="gray" bold>[S]</Text><Text> Path</Text></Text>
        <Text>  </Text>
        <Text><Text color="gray" bold>[Ctrl+C]</Text><Text> Quit</Text></Text>
      </Box>
    </Box>
  );
};
