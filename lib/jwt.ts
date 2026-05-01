import jwt, { SignOptions } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export interface JWTPayload {
  userId: string;
  email?: string;
  registerNumber?: string;
  role: 'student' | 'moduleAdmin' | 'superadmin' | 'admin';
  name: string;
  assignedModuleType?: 'coding' | 'mcq' | 'file_upload';
}

export function signToken(payload: JWTPayload): string {
  const opts: SignOptions = { expiresIn: 60 * 60 * 24 * 7 }; // 7 days in seconds
  return jwt.sign(payload, JWT_SECRET, opts);
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}
