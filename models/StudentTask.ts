import mongoose, { Schema, Document, Model } from 'mongoose';

export type StudentTaskStatus = 'available' | 'completed' | 'failed';

export interface IStudentTask extends Document {
  studentId: mongoose.Types.ObjectId;
  taskId: mongoose.Types.ObjectId;
  moduleId: mongoose.Types.ObjectId;
  status: StudentTaskStatus;
  startTime?: Date;         // when student first opened task
  deadlineTime?: Date;      // createdAt + task.duration
  submissionId?: mongoose.Types.ObjectId;
  notifiedReminder: boolean; // 30-min reminder sent
  pointsDeducted: boolean;   // -5 penalty applied on fail
  createdAt: Date;
  updatedAt: Date;
}

const StudentTaskSchema = new Schema<IStudentTask>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
    moduleId: { type: Schema.Types.ObjectId, ref: 'Module', required: true },
    status: {
      type: String,
      enum: ['available', 'completed', 'failed'],
      default: 'available',
    },
    startTime: { type: Date },
    deadlineTime: { type: Date },
    submissionId: { type: Schema.Types.ObjectId, ref: 'Submission' },
    notifiedReminder: { type: Boolean, default: false },
    pointsDeducted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// One record per student per task
StudentTaskSchema.index({ studentId: 1, taskId: 1 }, { unique: true });
StudentTaskSchema.index({ studentId: 1, status: 1 });
StudentTaskSchema.index({ deadlineTime: 1, status: 1 }); // for deadline processor

const StudentTask: Model<IStudentTask> =
  mongoose.models.StudentTask ||
  mongoose.model<IStudentTask>('StudentTask', StudentTaskSchema);

export default StudentTask;
