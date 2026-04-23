import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IScore extends Document {
  studentId: mongoose.Types.ObjectId;
  moduleId: mongoose.Types.ObjectId;
  totalPoints: number;
  easyPoints: number;
  intermediatePoints: number;
  expertPoints: number;
  completedTasks: number;
  rank?: number;
  updatedAt: Date;
}

const ScoreSchema = new Schema<IScore>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    moduleId: { type: Schema.Types.ObjectId, ref: 'Module', required: true },
    totalPoints: { type: Number, default: 0 },
    easyPoints: { type: Number, default: 0 },
    intermediatePoints: { type: Number, default: 0 },
    expertPoints: { type: Number, default: 0 },
    completedTasks: { type: Number, default: 0 },
    rank: { type: Number },
  },
  { timestamps: true }
);

ScoreSchema.index({ studentId: 1, moduleId: 1 }, { unique: true });
ScoreSchema.index({ moduleId: 1, totalPoints: -1 });

const Score: Model<IScore> =
  mongoose.models.Score || mongoose.model<IScore>('Score', ScoreSchema);

export default Score;
