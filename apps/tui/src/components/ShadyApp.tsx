import React, { useState } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import TextInput from 'ink-text-input';
import { Header } from './Header.js';
import { QRCodePanel } from './QRCodePanel.js';
import { PairingApproval } from './PairingApproval.js';
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
        <Text dimColor>Download folder path:</Text>
        <Box marginY={1}>
          <TextInput value={settingsPath} onChange={setSettingsPath} onSubmit={doneSettings} />
        </Box>
        <Text dimColor>Press Enter to save, Escape to cancel</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Header
        displayName={state.displayName}
        isConnected={state.isConnected}
        offline={offline}
      />

      <Box flexDirection="row" marginTop={1}>
        <Box flexDirection="column" marginRight={2}>
          <QRCodePanel
            sessionId={state.identity.sessionId}
            secret={state.qrSecret}
            pairingCode={state.pairingCode}
            offline={offline}
            expiresAt={state.sessionExpiresAt}
            onRefresh={state.refreshQr}
          />
        </Box>
        <Box flexDirection="column" flexGrow={1}>
          {state.pendingRequest ? (
            <PairingApproval
              request={state.pendingRequest}
              onAccept={state.approveRequest}
              onReject={state.rejectRequest}
            />
          ) : state.nearbyDevices.length > 0 ? (
            <Box flexDirection="column">
              <Text bold>NEARBY</Text>
              <Box flexDirection="column" marginTop={1}>
                {state.nearbyDevices.slice(0, 5).map((d: any) => (
                  <Text key={d.deviceId}>
                    <Text color="green">●</Text> {d.displayName} <Text dimColor>{d.os}</Text>
                  </Text>
                ))}
              </Box>
            </Box>
          ) : (
            <Box flexDirection="column">
              <Text dimColor>Waiting for connections...</Text>
            </Box>
          )}
        </Box>
      </Box>

      <ActivityLog entries={state.logs} />

      <Box justifyContent="center" marginTop={1}>
        {state.pendingRequest ? (
          <>
            <Text><Text color="green" bold>[A]</Text><Text> Accept</Text></Text>
            <Text>  </Text>
            <Text><Text color="red" bold>[R]</Text><Text> Reject</Text></Text>
          </>
        ) : (
          <>
            <Text><Text color="yellow" bold>[Q]</Text><Text> New QR</Text></Text>
            <Text>  </Text>
            <Text><Text color="gray" bold>[S]</Text><Text> Settings</Text></Text>
            <Text>  </Text>
            <Text><Text color="gray" bold>[Ctrl+C]</Text><Text> Quit</Text></Text>
          </>
        )}
      </Box>
    </Box>
  );
};
