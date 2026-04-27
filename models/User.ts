import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'student' | 'moduleAdmin' | 'superAdmin';
  assignedModules: mongoose.Types.ObjectId[]; // for moduleAdmin
  assignedModuleType?: 'coding' | 'mcq' | 'file_upload';
  department?: string;
  year?: number;
  totalPoints: number;
  avatar?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  category?: 'elite' | 'non-elite';
  fcmTokens?: string[];
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 6 },
    role: {
      type: String,
      enum: ['student', 'moduleAdmin', 'superAdmin'],
      default: 'student',
    },
    assignedModules: [{ type: Schema.Types.ObjectId, ref: 'Module' }],
    assignedModuleType: {
      type: String,
      enum: ['coding', 'mcq', 'file_upload'],
    },
    department: {
      type: String,
      enum: ['CSE', 'IT', 'ECE', 'EEE', 'BME', 'AIDS', 'MECH', 'CIVIL', 'OTHER'],
    },
    year: {
      type: Number,
      min: 1,
      max: 4,
    },
    totalPoints: { type: Number, default: 0 },
    avatar: { type: String },
    category: {
      type: String,
      enum: ['elite', 'non-elite'],
      default: 'non-elite',
    },
    isActive: { type: Boolean, default: true },
    fcmTokens: [{ type: String }],
  },
  { timestamps: true }
);

UserSchema.pre('save', async function (this: any) {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

UserSchema.methods.comparePassword = async function (candidatePassword: string) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
