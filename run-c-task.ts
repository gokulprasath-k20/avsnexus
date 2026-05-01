import mongoose from 'mongoose';
import connectDB from './lib/db';
import Task from './models/Task';
import { executeCode } from './lib/executor';


async function runTask() {
  try {
    await connectDB();
    console.log('Connected to DB');

    // Find the task we just created
    const task = await Task.findOne({ title: "Sum of Two Numbers" });
    if (!task) {
      console.log('Task not found. Run seed-c-task.ts first.');
      process.exit(1);
    }

    const solutionCode = `
#include <stdio.h>

int main() {
    int a, b;
    if (scanf("%d %d", &a, &b) == 2) {
        printf("%d\\n", a + b);
    }
    return 0;
}
    `;

    console.log('Testing solution against task test cases...');
    
    let allPassed = true;
    for (let i = 0; i < task.testCases!.length; i++) {
      const tc = task.testCases![i];
      console.log(`\nRunning Test Case ${i + 1}:`);
      console.log(`Input: ${tc.input.trim()}`);
      
      const result = await executeCode(solutionCode, 'c', tc.input);
      
      const output = result.stdout ? result.stdout.trim() : '';
      const expected = tc.expectedOutput.trim();
      
      console.log(`Output: ${output}`);
      console.log(`Expected: ${expected}`);
      
      if (output === expected) {
        console.log(`✅ Test Case ${i + 1} Passed`);
      } else {
        console.log(`❌ Test Case ${i + 1} Failed`);
        allPassed = false;
      }
    }

    if (allPassed) {
      console.log('\n🎉 All test cases passed successfully!');
    } else {
      console.log('\n⚠️ Some test cases failed.');
    }

    process.exit(0);
  } catch (err) {
    console.error('Error during run:', err);
    process.exit(1);
  }
}

runTask();
