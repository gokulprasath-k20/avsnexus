import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { uploadToCloudinary } from '@/lib/cloudinary';
import Submission from '@/models/Submission';
import Task from '@/models/Task';
import { requireAuth } from '@/lib/auth';

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];

export const POST = requireAuth(async (request: NextRequest, user) => {
  try {
    await connectDB();
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const taskId = formData.get('taskId') as string;

    if (!file || !taskId) {
      return NextResponse.json({ error: 'File and taskId are required' }, { status: 400 });
    }

    const task = await Task.findById(taskId);
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only PDF and PPT/PPTX files are allowed' },
        { status: 400 }
      );
    }

    // Validate file size
    const maxSizeMB = task.maxFileSizeMB || 10;
    if (file.size > maxSizeMB * 1024 * 1024) {
      return NextResponse.json(
        { error: `File size must be under ${maxSizeMB}MB` },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = `${user.userId}-${taskId}-${Date.now()}`;

    const { url, publicId } = await uploadToCloudinary(
      buffer,
      filename,
      'avs-nexus/submissions'
    );

    const submission = await Submission.create({
      studentId: user.userId,
      taskId,
      moduleId: task.moduleId,
      fileUrl: url,
      filePublicId: publicId,
      fileName: file.name,
      status: 'needs_review',
      score: 0,
      submittedAt: new Date(),
    });

    return NextResponse.json({ submission }, { status: 201 });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
});
