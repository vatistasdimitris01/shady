import React from 'react';
import { Box, Text } from 'ink';
import { getTimeSince } from '../lib/utils.js';
import type { LogEntry } from '../types.js';

interface ActivityLogProps {
  entries: LogEntry[];
  maxEntries?: number;
}

const ICONS: Record<string, string> = { info: 'ℹ', success: '✓', warning: '!', error: '✗', transfer: '↓' };
const COLORS: Record<string, string> = { info: 'white', success: 'green', warning: 'yellow', error: 'red', transfer: 'cyan' };

export const ActivityLog: React.FC<ActivityLogProps> = ({ entries, maxEntries = 6 }) => {
  const display = entries.slice(-maxEntries);
  return (
    <Box flexDirection="column" borderStyle="round" borderColor="gray" padding={1}>
      <Text bold color="gray">📋 Activity</Text>
      <Box marginTop={1} flexDirection="column">
        {display.length === 0 ? (
          <Text dimColor>Waiting for activity...</Text>
        ) : (
          display.map((e) => (
            <Box key={e.id}>
              <Text dimColor>{getTimeSince(e.timestamp)}</Text>
              <Text> </Text>
              <Text color={COLORS[e.type]}>{ICONS[e.type]} {e.message}</Text>
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
};
