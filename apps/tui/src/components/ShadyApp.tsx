import React from 'react';
import { Box, Text, useInput, useApp } from 'ink';
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

  useInput((input, key) => {
    if (key.ctrl && input === 'c') {
      exit();
      return;
    }

    if (state.pendingRequest) {
      if (input === 'a' || input === 'A') state.approveRequest();
      if (input === 'r' || input === 'R') state.rejectRequest();
    }

    if (input === 'q' || input === 'Q') state.refreshQr();
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Header
        displayName={state.displayName}
        isConnected={state.isConnected}
        offline={offline}
      />

      <QRCodePanel
        sessionId={state.identity.sessionId}
        secret={state.qrSecret}
        pairingCode={state.pairingCode}
        offline={offline}
        expiresAt={state.sessionExpiresAt}
        onRefresh={state.refreshQr}
      />

      {state.pendingRequest && (
        <PairingApproval
          request={state.pendingRequest}
          onAccept={state.approveRequest}
          onReject={state.rejectRequest}
        />
      )}

      {state.nearbyDevices.length > 0 && (
        <Box flexDirection="column" marginTop={1} borderStyle="round" borderColor="blue" padding={1}>
          <Text bold color="blue">NEARBY DEVICES ({state.nearbyDevices.length})</Text>
          {state.nearbyDevices.slice(0, 5).map((d: any) => (
            <Text key={d.deviceId}>
              <Text color="green">●</Text> {d.displayName} <Text dimColor>{d.os}</Text> <Text dimColor>— {d.match === 'city' ? d.city : `${d.city}, ${d.country}`}</Text>
            </Text>
          ))}
        </Box>
      )}

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
            <Text><Text color="gray" bold>[Ctrl+C]</Text><Text> Quit</Text></Text>
          </>
        )}
      </Box>
    </Box>
  );
};
