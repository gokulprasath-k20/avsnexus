import mongoose, { Schema, Document, Model } from 'mongoose';

export type TaskStage = 'easy' | 'intermediate' | 'expert';
export type TaskType = 'coding' | 'mcq' | 'file_upload' | 'design';

export interface ITestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

export interface IMCQOption {
  text: string;
  isCorrect: boolean;
}

export interface ITask extends Document {
  moduleId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  type: TaskType;
  stage: TaskStage;
  topic?: string;
  order: number;
  points: number;
  // Coding-specific
  allowedLanguages?: string[]; // ['c', 'cpp', 'python', 'java', 'javascript']
  starterCode?: Record<string, string>; // { python: '...', javascript: '...' }
  testCases?: ITestCase[];
  timeLimit?: number; // seconds for Judge0
  memoryLimit?: number; // MB
  // MCQ-specific
  options?: IMCQOption[];
  timeLimitMCQ?: number; // seconds
  // File upload-specific
  allowedFormats?: string[];
  maxFileSizeMB?: number;
  submissionGuidelines?: string;
  isActive: boolean;
  duration?: number; // deadline in minutes (0 = no deadline)
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TestCaseSchema = new Schema({
  input: { type: String, required: true },
  expectedOutput: { type: String, required: true },
  isHidden: { type: Boolean, default: false },
});

const MCQOptionSchema = new Schema({
  text: { type: String, required: true },
  isCorrect: { type: Boolean, default: false },
});

const TaskSchema = new Schema<ITask>(
  {
    moduleId: { type: Schema.Types.ObjectId, ref: 'Module', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    type: {
      type: String,
      enum: ['coding', 'mcq', 'file_upload', 'design'],
      required: true,
    },
    stage: {
      type: String,
      enum: ['easy', 'intermediate', 'expert'],
      required: true,
    },
    topic: { type: String },
    order: { type: Number, default: 0 },
    points: { type: Number, required: true, default: 10 },
    // Coding
    allowedLanguages: [{ type: String }],
    starterCode: { type: Map, of: String },
    testCases: [TestCaseSchema],
    timeLimit: { type: Number, default: 5 },
    memoryLimit: { type: Number, default: 128 },
    // MCQ
    options: [MCQOptionSchema],
    timeLimitMCQ: { type: Number, default: 60 },
    // File upload
    allowedFormats: [{ type: String }],
    maxFileSizeMB: { type: Number, default: 10 },
    submissionGuidelines: { type: String },
    duration: { type: Number, default: 0 }, // deadline minutes
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

TaskSchema.index({ moduleId: 1, stage: 1, order: 1 });

const Task: Model<ITask> =
  mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);

export default Task;
