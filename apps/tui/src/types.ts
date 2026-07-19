export const PROTOCOL_VERSION = '1.0.0';

export type DeviceType = 'desktop' | 'laptop' | 'phone' | 'tablet' | 'unknown';

export interface PairingRequest {
  sessionId: string;
  senderId: string;
  senderName: string;
  senderDeviceType: DeviceType;
  senderBrowser: string;
  senderOS: string;
  pairingCode: string;
  timestamp: number;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}
