import React from 'react';
import { Box, Text } from 'ink';

interface Shortcut { key: string; label: string; color?: string; }

const SHORTCUTS: Record<string, Shortcut[]> = {
  home: [
    { key: 'S', label: 'Send', color: 'cyan' },
    { key: 'A', label: 'Accept', color: 'green' },
    { key: 'R', label: 'Reject', color: 'red' },
    { key: 'Q', label: 'New QR', color: 'yellow' },
    { key: 'O', label: 'Mode', color: 'blue' },
    { key: 'D', label: 'Diag', color: 'gray' },
    { key: '?', label: 'Help', color: 'white' },
  ],
  help: [{ key: 'B', label: 'Back', color: 'gray' }],
  diagnostics: [
    { key: 'R', label: 'Refresh', color: 'cyan' },
    { key: 'B', label: 'Back', color: 'gray' },
  ],
};

interface FooterProps { screen: string; }

export const Footer: React.FC<FooterProps> = ({ screen }) => {
  const items = SHORTCUTS[screen] || SHORTCUTS.home;
  return (
    <Box justifyContent="center" marginTop={1}>
      {items.map((s, i) => (
        <Box key={s.key}>
          {i > 0 && <Text>  </Text>}
          <Text>
            <Text color={s.color || 'white'} bold>[{s.key}]</Text>
            <Text dimColor> {s.label}</Text>
          </Text>
        </Box>
      ))}
    </Box>
  );
};
