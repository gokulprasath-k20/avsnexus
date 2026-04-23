import mongoose, { Schema, Document, Model } from 'mongoose';

export type SubmissionStatus =
  | 'pending'
  | 'running'
  | 'accepted'
  | 'wrong_answer'
  | 'runtime_error'
  | 'time_limit_exceeded'
  | 'reviewed'
  | 'needs_review';

export interface ISubmission extends Document {
  studentId: mongoose.Types.ObjectId;
  taskId: mongoose.Types.ObjectId;
  moduleId: mongoose.Types.ObjectId;
  // Coding submission
  code?: string;
  language?: string;
  judge0Token?: string;
  testResults?: Array<{
    testCase: number;
    status: string;
    time?: number;
    memory?: number;
    output?: string;
    expected?: string;
  }>;
  // MCQ submission
  selectedAnswers?: number[];
  mcqScore?: number;
  // File upload submission
  fileUrl?: string;
  filePublicId?: string;
  fileName?: string;
  // Common
  status: SubmissionStatus;
  score: number;
  feedback?: string; // admin feedback
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SubmissionSchema = new Schema<ISubmission>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
    moduleId: { type: Schema.Types.ObjectId, ref: 'Module', required: true },
    // Coding
    code: { type: String },
    language: { type: String },
    judge0Token: { type: String },
    testResults: [
      {
        testCase: Number,
        status: String,
        time: Number,
        memory: Number,
        output: String,
        expected: String,
      },
    ],
    // MCQ
    selectedAnswers: [{ type: Number }],
    mcqScore: { type: Number },
    // File upload
    fileUrl: { type: String },
    filePublicId: { type: String },
    fileName: { type: String },
    // Common
    status: {
      type: String,
      enum: [
        'pending',
        'running',
        'accepted',
        'wrong_answer',
        'runtime_error',
        'time_limit_exceeded',
        'reviewed',
        'needs_review',
      ],
      default: 'pending',
    },
    score: { type: Number, default: 0 },
    feedback: { type: String },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

SubmissionSchema.index({ studentId: 1, taskId: 1 });
SubmissionSchema.index({ moduleId: 1, status: 1 });

const Submission: Model<ISubmission> =
  mongoose.models.Submission ||
  mongoose.model<ISubmission>('Submission', SubmissionSchema);

export default Submission;
