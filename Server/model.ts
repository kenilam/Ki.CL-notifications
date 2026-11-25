import mongoose, { Schema } from 'mongoose';

/** A record goes 30 days after it was last written. */
export const KEEP_MS = 30 * 24 * 60 * 60 * 1000;

export const LEVELS = ['neutral', 'confirm', 'error', 'info', 'warning'] as const;

export type Level = (typeof LEVELS)[number];

export interface Text {
  key: string;
  values: Record<string, unknown>;
}

export interface Notification {
  _id: mongoose.Types.ObjectId;
  ownerGUID: string;
  source: string;
  at: Date;
  path: string;
  level: Level;
  running: boolean;
  namespace: string;
  title: Text;
  message: Text;
  dismissedAt: Date | null;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TextSchema = new Schema<Text>(
  { key: { type: String, required: true }, values: { type: Schema.Types.Mixed, default: {} } },
  { _id: false, minimize: false },
);

const NotificationSchema = new Schema<Notification>(
  {
    ownerGUID: { type: String, required: true },
    source: { type: String, required: true },
    at: { type: Date, required: true },
    path: { type: String, required: true },
    level: { type: String, enum: LEVELS, required: true },
    running: { type: Boolean, required: true },
    namespace: { type: String, required: true },
    title: { type: TextSchema, required: true },
    message: { type: TextSchema, required: true },
    dismissedAt: { type: Date, default: null },
    expiresAt: { type: Date, required: true },
  },
  { collection: 'notifications', timestamps: true, minimize: false },
);

NotificationSchema.index({ ownerGUID: 1, source: 1 }, { unique: true });
NotificationSchema.index({ ownerGUID: 1, updatedAt: -1 });
NotificationSchema.index({ source: 1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Notifications = mongoose.model<Notification>('Notifications', NotificationSchema);
