import mongoose from 'mongoose';
import connectDB from './lib/db';
import Task from './models/Task';
import Module from './models/Module';
import User from './models/User';


async function seedTask() {
  try {
    await connectDB();
    console.log('Connected to DB');

    const superAdmin = await User.findOne({ role: 'superAdmin' });
    if (!superAdmin) {
      console.log('No superAdmin found to create the task.');
      process.exit(1);
    }

    let module = await Module.findOne();
    if (!module) {
      console.log('No module found, creating one...');
      module = await Module.create({
        name: 'Introduction to C Programming',
        description: 'Learn the basics of C',
        type: 'coding',
        createdBy: superAdmin._id,
      });
    }

    const taskData = {
      moduleId: module._id,
      title: "Sum of Two Numbers",
      description: "Write a C program that takes two integers as input and prints their sum. Your output should be exactly the calculated sum, with no extra text. For example, if the input is `5 7`, your program should output `12`.",
      type: "coding",
      stage: "easy",
      topic: "Basic I/O",
      order: 1,
      points: 10,
      starterCode: {
        "c": "#include <stdio.h>\n\nint main() {\n    int a, b;\n    // Read a and b from standard input\n    \n    // Calculate the sum\n    \n    // Print the result\n    \n    return 0;\n}"
      },
      testCases: [
        {
          input: "5 7\n",
          expectedOutput: "12",
          isHidden: false
        },
        {
          input: "-3 8\n",
          expectedOutput: "5",
          isHidden: false
        },
        {
          input: "100 -200\n",
          expectedOutput: "-100",
          isHidden: true
        },
        {
          input: "0 0\n",
          expectedOutput: "0",
          isHidden: true
        }
      ],
      timeLimit: 2,
      memoryLimit: 128,
      createdBy: superAdmin._id
    };

    const task = await Task.create(taskData);
    console.log('Task created successfully:', task._id);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seedTask();
