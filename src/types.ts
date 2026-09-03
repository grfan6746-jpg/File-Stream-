export interface StorageDevice {
  id: string;
  name: string;
  type: 'internal' | 'usb' | 'sdcard' | 'custom';
  path: string;
  totalSpace: number; // bytes
  freeSpace: number; // bytes
  isMounted: boolean;
  isReadOnly: boolean;
}

export interface MediaFile {
  name: string;
  path: string;
  relativePath: string;
  storageId: string;
  isDir: boolean;
  size: number; // bytes
  extension: string;
  mimeType: string;
  modifiedTime: string;
  category: 'video' | 'audio' | 'image' | 'folder' | 'other';
}

export interface ServerConfig {
  serverName: string;
  host: string;
  port: number;
  detectedIp: string;
  authEnabled: boolean;
  username: string;
  password?: string;
  customStorages: { id: string; name: string; path: string }[];
  maxChunkSizeKb: number;
  allowPublicWan: boolean;
}

export interface ServerStatus {
  online: boolean;
  uptimeSeconds: number;
  activeStreams: number;
  bytesServed: number;
  detectedIps: string[];
  cpuPercent?: number;
  memoryMb?: number;
  port: number;
  serverName: string;
}

export interface ProjectFile {
  path: string;
  name: string;
  language: string;
  content: string;
  category: 'server' | 'web' | 'scripts' | 'config' | 'doc';
  description: string;
}
