import React, { useState, useEffect, useCallback } from 'react';
import { Box, useInput, useApp } from 'ink';
import { Header } from './Header.js';
import { QRCodePanel } from './QRCodePanel.js';
import { PairingApproval } from './PairingApproval.js';
import { TransferProgress } from './TransferProgress.js';
import { ActivityLog } from './ActivityLog.js';
import { Footer } from './Footer.js';
import { HelpScreen } from './HelpScreen.js';
import { NetworkDiagnostics } from './NetworkDiagnostics.js';
import { AboutScreen } from './AboutScreen.js';
import { useShadyState } from '../hooks/useShadyState.js';
import type { Screen } from '../types.js';

interface ShadyAppProps {
  offline: boolean;
}

export const ShadyApp: React.FC<ShadyAppProps> = ({ offline }) => {
  const { exit } = useApp();
  const [screen, setScreen] = useState<Screen>('home');
  const state = useShadyState(offline);

  useInput((input, key) => {
    if (screen === 'help' || screen === 'diagnostics' || screen === 'about') {
      if (input === 'b' || input === 'B' || key.escape) setScreen('home');
      if (screen === 'diagnostics' && input === 'r') {}
      return;
    }

    if (screen !== 'home') {
      if (input === 'b' || input === 'B' || key.escape) setScreen('home');
      return;
    }

    if (key.ctrl && input === 'c') {
      exit();
      return;
    }

    switch (input.toLowerCase()) {
      case 'a': state.approveRequest(); break;
      case 'r': state.rejectRequest(); break;
      case 'q': state.refreshQr(); break;
      case 'o': state.toggleVisibility(); break;
      case 'd': setScreen('diagnostics'); break;
      case '?': setScreen('help'); break;
      case 'i': setScreen('about'); break;
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Header
        displayName={state.identity.displayName}
        isConnected={state.isConnected}
        offline={offline}
        sessionExpiresAt={state.sessionExpiresAt}
      />

      <QRCodePanel
        sessionId={state.identity.sessionId}
        secret={state.qrSecret}
        pairingCode={state.pairingCode}
        offline={offline}
        port={8787}
        expiresAt={state.sessionExpiresAt}
        onRefresh={state.refreshQr}
      />

      {state.pendingRequest && (
        <PairingApproval
          request={state.pendingRequest}
          onAccept={state.approveRequest}
          onReject={state.rejectRequest}
          onBlock={state.rejectRequest}
        />
      )}

      {screen === 'help' && <HelpScreen />}
      {screen === 'diagnostics' && <NetworkDiagnostics />}
      {screen === 'about' && <AboutScreen />}

      <ActivityLog entries={state.logs} />

      <Footer screen={screen} />
    </Box>
  );
};
