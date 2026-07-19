export const PROTOCOL_VERSION = '1.0.0';

export type Screen = 'home' | 'transfers' | 'requests' | 'history' | 'incomplete' | 'settings' | 'diagnostics' | 'about' | 'help';
export type DeviceType = 'desktop' | 'laptop' | 'phone' | 'tablet' | 'unknown';
export type PairingStatus = 'pending' | 'approved' | 'rejected' | 'expired';
export type TransferStatus = 'pending' | 'transferring' | 'paused' | 'completed' | 'failed' | 'cancelled';
export type VisibilityMode = 'hidden' | 'qr-only' | 'nearby' | 'nearby-5min';

export interface PairingRequest {
  sessionId: string;
  senderName: string;
  senderDeviceType: DeviceType;
  senderBrowser: string;
  senderOS: string;
  pairingCode: string;
  timestamp: number;
}

export interface ActiveTransfer {
  id: string;
  senderName: string;
  files: ActiveTransferFile[];
  totalSize: number;
  receivedSize: number;
  status: TransferStatus;
  startedAt: number;
}

export interface ActiveTransferFile {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  progress: number;
  speed: number;
  status: TransferStatus;
  receivedChunks: number;
  totalChunks: number;
  startedAt: number;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  type: 'info' | 'success' | 'warning' | 'error' | 'transfer';
  message: string;
}
