/**
 * Tipos y interfaces de la aplicación
 */

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  collaborators: string[];
  thumbnail?: string;
}

export interface Camera {
  id: string;
  projectId: string;
  name: string;
  deviceId: string;
  isActive: boolean;
  battery?: number;
  lastSync?: Date;
}

export interface Video {
  id: string;
  projectId: string;
  cameraId: string;
  title: string;
  description?: string;
  uri: string;
  duration: number;
  fileSize: number;
  createdAt: Date;
  updatedAt: Date;
  isUploaded: boolean;
  thumbnail?: string;
}

export interface Recording {
  id: string;
  projectId: string;
  cameraId: string;
  startTime: Date;
  endTime?: Date;
  isActive: boolean;
  quality: 'low' | 'medium' | 'high';
}

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
}

export enum AppError {
  FIREBASE_ERROR = 'FIREBASE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}
