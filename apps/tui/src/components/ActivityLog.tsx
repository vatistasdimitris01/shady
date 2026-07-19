import React from 'react';
import { Box, Text } from 'ink';
import { getTimeSince } from '../lib/utils.js';
import type { LogEntry } from '../types.js';

interface ActivityLogProps {
  entries: LogEntry[];
  maxEntries?: number;
}

const COLORS: Record<string, string> = { info: 'white', success: 'green', warning: 'yellow', error: 'red' };

export const ActivityLog: React.FC<ActivityLogProps> = ({ entries, maxEntries = 5 }) => {
  const display = entries.slice(-maxEntries);
  return (
    <Box flexDirection="column" marginTop={1}>
      {display.map((e) => (
        <Box key={e.id}>
          <Text dimColor>{getTimeSince(e.timestamp)} </Text>
          <Text color={COLORS[e.type]}>{e.message}</Text>
        </Box>
      ))}
    </Box>
  );
};
