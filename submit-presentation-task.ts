import mongoose from 'mongoose';
import connectDB from './lib/db';
import Task from './models/Task';
import Submission from './models/Submission';
import User from './models/User';
import { uploadToCloudinary } from './lib/cloudinary';

async function submitPresentationTask() {
  try {
    await connectDB();
    console.log('Connected to DB');

    // 1. Find the presentation task we seeded earlier
    const task = await Task.findOne({ title: 'Web Architecture Presentation' });
    if (!task) {
      console.log('Presentation task not found! Did you run seed-quiz-presentation.ts?');
      process.exit(1);
    }

    // 2. Find a user to act as the student
    // For testing, we'll just use the superAdmin or create a dummy student
    let student = await User.findOne({ email: 'student@example.com' });
    if (!student) {
      console.log('Creating a dummy student...');
      student = await User.create({
        name: 'Test Student',
        email: 'student@example.com',
        password: 'password123',
        role: 'student',
      });
    }

    // 3. Create a mock PDF file in memory
    console.log('Generating mock PDF buffer...');
    const mockPdfContent = '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
    const mockBuffer = Buffer.from(mockPdfContent, 'utf-8');
    const filename = `${student._id}-${task._id}-${Date.now()}`;

    // 4. Mocking Cloudinary upload (to avoid invalid PDF error with our fake buffer)
    console.log('Mocking Cloudinary upload for the test PDF...');
    const url = `https://res.cloudinary.com/demo/image/upload/v1234567890/${filename}.pdf`;
    const publicId = `avs-nexus/submissions/${filename}`;
    console.log(`Uploaded successfully! URL: ${url}`);

    // 5. Create the submission in the database
    console.log('Creating Submission record...');
    const submission = await Submission.create({
      studentId: student._id,
      taskId: task._id,
      moduleId: task.moduleId,
      fileUrl: url,
      filePublicId: publicId,
      fileName: 'web_architecture.pdf',
      status: 'needs_review', // file uploads need manual review
      score: 0,
      submittedAt: new Date(),
    });

    console.log('🎉 Presentation submitted successfully!');
    console.log('Submission ID:', submission._id);

    process.exit(0);
  } catch (err) {
    console.error('Error during submission:', err);
    process.exit(1);
  }
}

submitPresentationTask();
