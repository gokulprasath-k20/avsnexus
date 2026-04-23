import mongoose, { Schema, Document, Model } from 'mongoose';

export type ModuleType = 'coding' | 'mcq' | 'file_upload' | 'design';

export interface IStageConfig {
  easy: { count: number; pointsPerTask: number };
  intermediate: { count: number; pointsPerTask: number };
  expert: { count: number; pointsPerTask: number };
}

export interface IModule extends Document {
  name: string;
  description: string;
  type: ModuleType;
  icon?: string;
  coverImage?: string;
  stageConfig: IStageConfig;
  topics: string[];
  assignedAdmins: mongoose.Types.ObjectId[];
  isActive: boolean;
  order: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const StageConfigSchema = new Schema({
  easy: {
    count: { type: Number, default: 10 },
    pointsPerTask: { type: Number, default: 10 },
  },
  intermediate: {
    count: { type: Number, default: 15 },
    pointsPerTask: { type: Number, default: 20 },
  },
  expert: {
    count: { type: Number, default: 20 },
    pointsPerTask: { type: Number, default: 30 },
  },
});

const ModuleSchema = new Schema<IModule>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    type: {
      type: String,
      enum: ['coding', 'mcq', 'file_upload', 'design'],
      required: true,
    },
    icon: { type: String, default: '📚' },
    coverImage: { type: String },
    stageConfig: { type: StageConfigSchema, default: () => ({}) },
    topics: [{ type: String }],
    assignedAdmins: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

const Module: Model<IModule> =
  mongoose.models.Module || mongoose.model<IModule>('Module', ModuleSchema);

export default Module;
