import mongoose, { Schema, Model, Document } from 'mongoose';

export interface ISystemConfig extends Document {
  googleTagManagerId?: string;
  googleAnalyticsId?: string;
  googleAnalyticsPropertyId?: string;
  metaPixelId?: string;
  facebookAccessToken?: string;
  facebookDomainVerification?: string;
  facebookTestEventCode?: string;
  googleSearchConsoleId?: string;
  searchConsoleMeta?: string;
  superAdminNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SystemConfigSchema = new Schema<ISystemConfig>(
  {
    googleTagManagerId: { type: String, default: '' },
    googleAnalyticsId: { type: String, default: '' },
    googleAnalyticsPropertyId: { type: String, default: '' },
    metaPixelId: { type: String, default: '' },
    facebookAccessToken: { type: String, default: '' },
    facebookDomainVerification: { type: String, default: '' },
    facebookTestEventCode: { type: String, default: '' },
    googleSearchConsoleId: { type: String, default: '' },
    searchConsoleMeta: { type: String, default: '' },
    superAdminNote: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

const SystemConfig: Model<ISystemConfig> =
  mongoose.models.SystemConfig || mongoose.model<ISystemConfig>('SystemConfig', SystemConfigSchema);

export default SystemConfig;
