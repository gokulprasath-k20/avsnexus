import mongoose from 'mongoose';
import connectDB from './lib/db';
import Task from './models/Task';
import Module from './models/Module';
import User from './models/User';

async function seedQuizAndPresentation() {
  try {
    await connectDB();
    console.log('Connected to DB');

    const superAdmin = await User.findOne({ role: 'superAdmin' });
    if (!superAdmin) {
      console.log('No superAdmin found to create the tasks.');
      process.exit(1);
    }

    let module = await Module.findOne({ name: 'Web Development Basics' });
    if (!module) {
      console.log('Creating Web Development Basics module...');
      module = await Module.create({
        name: 'Web Development Basics',
        description: 'Learn the fundamentals of building modern web applications.',
        type: 'mcq',
        createdBy: superAdmin._id,
      });
    }

    // 1. Create MCQ (Quiz) Task
    console.log('Creating MCQ Task...');
    const quizTask = await Task.create({
      moduleId: module._id,
      title: 'HTML & CSS Fundamentals Quiz',
      description: 'Test your knowledge on basic HTML structure and CSS styling properties.',
      type: 'mcq',
      stage: 'easy',
      topic: 'Frontend Basics',
      order: 1,
      points: 20,
      options: [
        { text: 'To structure the content on the web page', isCorrect: true },
        { text: 'To add interactivity and logic', isCorrect: false },
        { text: 'To style the visual layout', isCorrect: false },
        { text: 'To communicate with the database', isCorrect: false },
      ],
      timeLimitMCQ: 120, // 2 minutes
      createdBy: superAdmin._id,
    });
    console.log('MCQ Task created successfully:', quizTask._id);

    // 2. Create File Upload (Presentation) Task
    console.log('Creating Presentation Upload Task...');
    const presentationTask = await Task.create({
      moduleId: module._id,
      title: 'Web Architecture Presentation',
      description: 'Create a short 5-slide presentation explaining how the Client-Server model works in modern web applications. Upload your presentation as a PDF or PPTX file.',
      type: 'file_upload',
      stage: 'intermediate',
      topic: 'Systems Architecture',
      order: 2,
      points: 50,
      allowedFormats: ['.pdf', '.pptx', '.ppt'],
      maxFileSizeMB: 10,
      submissionGuidelines: 'Ensure your slides contain clear diagrams. The first slide must be a title slide with your name.',
      createdBy: superAdmin._id,
    });
    console.log('Presentation Task created successfully:', presentationTask._id);

    process.exit(0);
  } catch (err) {
    console.error('Error during seeding:', err);
    process.exit(1);
  }
}

seedQuizAndPresentation();
