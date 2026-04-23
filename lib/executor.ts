import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import axios from 'axios';

const execAsync = promisify(exec);

export async function runWithJDoodle(code: string, language: string, input: string) {
  const LANG_MAP: Record<string, { lang: string; version: string }> = {
    python: { lang: 'python3', version: '4' },
    javascript: { lang: 'nodejs', version: '4' },
    java: { lang: 'java', version: '4' },
    cpp: { lang: 'cpp17', version: '1' },
    c: { lang: 'c', version: '5' },
  };

  const l = LANG_MAP[language.toLowerCase()] || LANG_MAP.python;

  const response = await axios.post(
    'https://api.jdoodle.com/v1/execute',
    {
      clientId: process.env.JDOODLE_CLIENT_ID,
      clientSecret: process.env.JDOODLE_CLIENT_SECRET,
      script: code,
      stdin: input,
      language: l.lang,
      versionIndex: l.version,
    },
    { headers: { 'Content-Type': 'application/json' } }
  );

  return response.data;
}

export async function runWithLocal(code: string, language: string, input: string) {
  const tmpDir = os.tmpdir();
  const filename = `code_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  
  // For Java, the file must match the public class name. 
  // Let's assume the user uses class "Main" for java tasks.
  const actualFilename = language === 'java' ? 'Main' : filename;
  let ext = '';
  let command = '';

  if (language === 'python') {
    ext = '.py';
    command = `python ${actualFilename}${ext}`; 
  } else if (language === 'javascript') {
    ext = '.js';
    command = `node ${actualFilename}${ext}`;
  } else if (language === 'java') {
    ext = '.java';
    command = `javac ${actualFilename}${ext} && java ${actualFilename}`;
  } else if (language === 'cpp') {
    ext = '.cpp';
    command = process.platform === 'win32' 
      ? `g++ ${actualFilename}${ext} -o ${actualFilename}.exe && ${actualFilename}.exe` 
      : `g++ ${actualFilename}${ext} -o ${actualFilename} && ./${actualFilename}`;
  } else if (language === 'c') {
    ext = '.c';
    command = process.platform === 'win32' 
      ? `gcc ${actualFilename}${ext} -o ${actualFilename}.exe && ${actualFilename}.exe` 
      : `gcc ${actualFilename}${ext} -o ${actualFilename} && ./${actualFilename}`;
  } else {
    throw new Error('Unsupported language for local execution');
  }

  const filepath = path.join(tmpDir, `${actualFilename}${ext}`);
  const inputpath = path.join(tmpDir, `${filename}.in`);

  await fs.writeFile(filepath, code);
  await fs.writeFile(inputpath, input || '');

  let output = '';
  const startTime = process.hrtime();
  try {
    const { stdout, stderr } = await execAsync(`${command} < ${filename}.in`, {
      cwd: tmpDir,
      timeout: 5000, 
    });
    output = stdout + (stderr ? '\n' + stderr : '');
  } catch (error: any) {
    output = (error.stdout || '') + (error.stderr ? '\n' + error.stderr : '') + (error.message && !error.stderr ? '\n' + error.message : '');
  } finally {
    const endTime = process.hrtime(startTime);
    // Cleanup
    try {
      await fs.unlink(filepath).catch(() => {});
      await fs.unlink(inputpath).catch(() => {});
      if (language === 'cpp' || language === 'c') {
        const exeFile = process.platform === 'win32' ? `${actualFilename}.exe` : actualFilename;
        await fs.unlink(path.join(tmpDir, exeFile)).catch(() => {});
      }
      if (language === 'java') {
        await fs.unlink(path.join(tmpDir, `${actualFilename}.class`)).catch(() => {});
      }
    } catch (e) {}
    
    return {
      output: output.trim(),
      cpuTime: (endTime[0] + endTime[1] / 1e9).toFixed(2),
      memory: 0,
    };
  }
}

export async function executeCode(code: string, language: string, input: string) {
  const engine = process.env.EXECUTION_ENGINE || 'jdoodle';
  
  if (engine === 'local') {
    return runWithLocal(code, language, input);
  } else {
    return runWithJDoodle(code, language, input);
  }
}
