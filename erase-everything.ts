import mongoose from 'mongoose';
import process from 'node:process';
import connectDB from './lib/db';
import Task from './models/Task';
import Submission from './models/Submission';
import Module from './models/Module';
import User from './models/User';

async function eraseEverything() {
  try {
    await connectDB();
    console.log('Connected to DB');

    // Delete all tasks
    const taskResult = await Task.deleteMany({});
    console.log(`Deleted ${taskResult.deletedCount} tasks.`);

    // Delete all submissions
    const submissionResult = await Submission.deleteMany({});
    console.log(`Deleted ${submissionResult.deletedCount} submissions.`);

    // Delete all modules
    const moduleResult = await Module.deleteMany({});
    console.log(`Deleted ${moduleResult.deletedCount} modules.`);

    // Reset module admin assignments
    const userResult = await User.updateMany(
      { role: 'moduleAdmin' },
      { $set: { assignedModules: [], assignedModuleType: undefined } }
    );
    console.log(`Reset assignments for ${userResult.modifiedCount} module admins.`);

    console.log('Database wipe complete.');
    process.exit(0);
  } catch (err) {
    console.error('Error erasing data:', err);
    process.exit(1);
  }
}

eraseEverything();
