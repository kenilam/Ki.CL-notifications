import type { Level } from 'notification/notification/documents';

/** One of each look the bell can give a notification. */
const PREVIEWS: { id: string; level: Level; running: boolean }[] = [
  { id: 'running', level: 'INFO', running: true },
  { id: 'confirm', level: 'CONFIRM', running: false },
  { id: 'info', level: 'INFO', running: false },
  { id: 'warning', level: 'WARNING', running: false },
  { id: 'error', level: 'ERROR', running: false },
  { id: 'neutral', level: 'NEUTRAL', running: false },
];

export { PREVIEWS };
