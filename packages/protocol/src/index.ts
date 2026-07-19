export const PROTOCOL_VERSION = '1.0.0';

export type DeviceType = 'desktop' | 'laptop' | 'phone' | 'tablet' | 'unknown';
export type VisibilityMode = 'hidden' | 'qr-only' | 'nearby' | 'nearby-5min';
export type DuplicateBehavior = 'rename' | 'ask' | 'replace' | 'reject';
export type TransferStatus = 'pending' | 'transferring' | 'paused' | 'completed' | 'failed' | 'cancelled';
export type PairingStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export interface HeartbeatPayload {
  deviceId: string;
  displayName: string;
  publicKey: string;
  sessionId: string;
  protocolVersion: string;
  capabilities: string[];
  os: string;
  deviceType: DeviceType;
  visibility: VisibilityMode;
}

export interface ReceiverRecord extends HeartbeatPayload {
  lastSeen: number;
  networkScope: string;
}

export interface ReceiverListItem {
  deviceId: string;
  displayName: string;
  deviceType: DeviceType;
  os: string;
  lastSeen: number;
  ready: boolean;
}

export interface SignalMessage {
  id: string;
  sessionId: string;
  from: string;
  type: 'offer' | 'answer' | 'ice-candidate' | 'pair-request' | 'pair-approve' | 'pair-reject' | 'cancel';
  payload: unknown;
  timestamp: number;
}

export interface FileManifest {
  transferId: string;
  files: FileManifestEntry[];
}

export interface FileManifestEntry {
  fileId: string;
  name: string;
  size: number;
  mimeType: string;
  relativePath: string;
  lastModified: number;
  sha256: string;
}

export interface ChunkMessage {
  transferId: string;
  fileId: string;
  chunkIndex: number;
  totalChunks: number;
  data: ArrayBuffer;
}

export interface TransferControl {
  transferId: string;
  fileId?: string;
  type: 'hello' | 'manifest' | 'manifest-accept' | 'manifest-reject' | 'chunk-ack' | 'pause' | 'resume' | 'cancel' | 'complete' | 'hash-verified' | 'error' | 'goodbye';
  payload?: unknown;
}

export interface PairingRequest {
  sessionId: string;
  senderName: string;
  senderDeviceType: DeviceType;
  senderBrowser: string;
  senderOS: string;
  pairingCode: string;
  timestamp: number;
}

export interface AppState {
  identity: {
    deviceId: string;
    displayName: string;
    sessionId: string;
    publicKey: string;
    createdAt: number;
  };
  network: {
    localIp: string;
    isConnected: boolean;
    mode: 'online' | 'offline';
    port?: number;
  };
  visibility: VisibilityMode;
  screen: Screen;
  connectedSenders: ConnectedSender[];
  activeTransfers: ActiveTransfer[];
  pendingRequests: PairingRequest[];
  history: TransferRecord[];
  incompleteTransfers: IncompleteTransfer[];
  logs: LogEntry[];
  sessionExpiresAt: number;
  qrSecret: string;
  pairingCode: string;
}

export type Screen = 'home' | 'transfers' | 'requests' | 'history' | 'incomplete' | 'settings' | 'diagnostics' | 'about' | 'help';

export interface ConnectedSender {
  id: string;
  name: string;
  deviceType: DeviceType;
  browser: string;
  os: string;
  connectedAt: number;
  status: PairingStatus;
  pairingCode: string;
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

export interface TransferRecord {
  id: string;
  senderName: string;
  files: { name: string; size: number; status: string }[];
  totalSize: number;
  status: string;
  completedAt: number;
}

export interface IncompleteTransfer {
  id: string;
  senderName: string;
  files: { name: string; size: number; progress: number }[];
  totalSize: number;
  receivedSize: number;
  savedAt: number;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  type: 'info' | 'success' | 'warning' | 'error' | 'transfer';
  message: string;
}
