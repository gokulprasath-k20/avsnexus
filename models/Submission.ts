import mongoose, { Schema, Document, Model } from 'mongoose';

export type SubmissionStatus =
  | 'pending'
  | 'running'
  | 'accepted'
  | 'wrong_answer'
  | 'runtime_error'
  | 'time_limit_exceeded'
  | 'reviewed'
  | 'needs_review'
  | 'pass'
  | 'fail';

export interface ISubmission extends Document {
  studentId: mongoose.Types.ObjectId;
  taskId: mongoose.Types.ObjectId;
  moduleId: mongoose.Types.ObjectId;
  
  // Coding submission
  code?: string;
  language?: string;
  input?: string;
  output?: string;
  error?: string;
  compileError?: string;
  executionTime?: string;
  memory?: number;
  testResults?: Array<{
    testCase: number;
    status: string;
    time?: number;
    memory?: number;
    output?: string;
    expected?: string;
    isHidden: boolean;
  }>;

  // MCQ submission details
  mcqAnswers: Array<{
    question: string;
    selectedAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }>;
  totalQuestions: number;
  attendedQuestions: number;
  
  // File upload submission
  fileUrl?: string;
  filePublicId?: string;
  fileName?: string;

  // Common Evaluation
  status: SubmissionStatus;
  marks: number; // Final marks assigned by admin or auto
  remarks?: string; // Admin comments
  score: number; // Redundant but kept for compatibility with existing code
  feedback?: string; // Redundant but kept for compatibility
  
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  
  // Anti-cheating & Timer
  violationCount: number;
  plagiarismScore: number;
  flagged: boolean;
  startedAt: Date;
  submittedAt: Date;
  isAutoSubmitted: boolean;
  reason?: string;
  
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
    input: { type: String },
    output: { type: String },
    error: { type: String },
    compileError: { type: String },
    executionTime: { type: String },
    memory: { type: Number },
    testResults: [
      {
        testCase: Number,
        status: String,
        time: Number,
        memory: Number,
        output: String,
        expected: String,
        isHidden: Boolean,
      },
    ],
    
    // MCQ
    mcqAnswers: [
      {
        question: String,
        selectedAnswer: String,
        correctAnswer: String,
        isCorrect: Boolean,
      }
    ],
    totalQuestions: { type: Number, default: 0 },
    attendedQuestions: { type: Number, default: 0 },
    
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
        'pass',
        'fail',
      ],
      default: 'pending',
    },
    marks: { type: Number, default: 0 },
    remarks: { type: String },
    score: { type: Number, default: 0 },
    feedback: { type: String },
    
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    
    violationCount: { type: Number, default: 0 },
    plagiarismScore: { type: Number, default: 0 },
    flagged: { type: Boolean, default: false },
    
    startedAt: { type: Date },
    submittedAt: { type: Date, default: Date.now },
    isAutoSubmitted: { type: Boolean, default: false },
    reason: { type: String },
  },
  { timestamps: true }
);

SubmissionSchema.index({ studentId: 1, taskId: 1 });
SubmissionSchema.index({ moduleId: 1, status: 1 });

const Submission: Model<ISubmission> =
  mongoose.models.Submission ||
  mongoose.model<ISubmission>('Submission', SubmissionSchema);

export default Submission;
