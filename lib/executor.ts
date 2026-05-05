import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import axios from 'axios';

const execAsync = promisify(exec);

const JUDGE0_API_URL = process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com';
const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY;

const JUDGE0_LANG_MAP: Record<string, number> = {
  c: 50, // C (GCC 9.2.0)
  cpp: 54, // C++ (GCC 9.2.0)
  python: 71, // Python (3.8.1)
  java: 62, // Java (OpenJDK 13.0.1)
  javascript: 63, // JavaScript (Node.js 12.14.0)
};

export async function runWithJudge0(code: string, language: string, input: string) {
  const languageId = JUDGE0_LANG_MAP[language.toLowerCase()];
  if (!languageId) throw new Error(`Unsupported language: ${language}`);

  try {
    // Create submission
    const response = await axios.post(
      `${JUDGE0_API_URL}/submissions?base64_encoded=false&wait=true`,
      {
        source_code: code,
        language_id: languageId,
        stdin: input,
      },
      {
        headers: {
          'content-type': 'application/json',
          'X-RapidAPI-Key': JUDGE0_API_KEY,
          'X-RapidAPI-Host': new URL(JUDGE0_API_URL).hostname,
        },
      }
    );

    const data = response.data;
    
    return {
      stdout: data.stdout || '',
      stderr: data.stderr || '',
      compileError: data.compile_output || '',
      time: data.time || '0',
      memory: data.memory || 0,
      statusCode: data.status?.id || 200,
      statusDescription: data.status?.description || 'Success'
    };
  } catch (error: any) {
    console.error('Judge0 Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Code execution engine error');
  }
}


export async function runWithJDoodle(code: string, language: string, input: string) {
  const LANG_MAP: Record<string, { lang: string; version: string }> = {
    python: { lang: 'python3', version: '4' },
    javascript: { lang: 'nodejs', version: '4' },
    java: { lang: 'java', version: '4' },
    cpp: { lang: 'cpp17', version: '1' },
    c: { lang: 'c', version: '5' },
  };

  const l = LANG_MAP[language.toLowerCase()] || LANG_MAP.python;

  try {
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

    const data = response.data;
    
    let stdout = data.output || '';
    let stderr = '';
    let compileError = '';

    // JDoodle combines everything in 'output'.
    // Let's try to detect if it looks like a compilation or runtime error.
    const lowerOutput = stdout.toLowerCase();
    if (data.statusCode !== 200 || lowerOutput.includes('error:') || lowerOutput.includes('exception in thread')) {
      // If it looks like a compilation error (common in C/C++/Java)
      if (lowerOutput.includes('error:') && (language === 'c' || language === 'cpp' || language === 'java')) {
        compileError = stdout;
        stdout = '';
      } else {
        stderr = stdout;
        stdout = '';
      }
    }
    
    return {
      stdout,
      stderr,
      compileError,
      time: data.cpuTime || '0',
      memory: data.memory || 0,
      statusCode: data.statusCode
    };
  } catch (error: any) {
    return {
      stdout: '',
      stderr: error.response?.data?.error || error.message,
      compileError: '',
      time: '0',
      memory: 0,
      statusCode: 500
    };
  }
}

export async function runWithLocal(code: string, language: string, input: string) {
  const tmpDir = os.tmpdir();
  const filename = `code_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const actualFilename = language === 'java' ? 'Main' : filename;
  let ext = '';
  let command = '';
  let compileCommand = '';

  if (language === 'python') {
    ext = '.py';
    command = `python ${actualFilename}${ext}`; 
  } else if (language === 'javascript') {
    ext = '.js';
    command = `node ${actualFilename}${ext}`;
  } else if (language === 'java') {
    ext = '.java';
    compileCommand = `javac ${actualFilename}${ext}`;
    command = `java ${actualFilename}`;
  } else if (language === 'cpp') {
    ext = '.cpp';
    compileCommand = `g++ ${actualFilename}${ext} -o ${actualFilename}.out`;
    command = process.platform === 'win32' ? `${actualFilename}.out` : `./${actualFilename}.out`;
  } else if (language === 'c') {
    ext = '.c';
    compileCommand = `gcc ${actualFilename}${ext} -o ${actualFilename}.out`;
    command = process.platform === 'win32' ? `${actualFilename}.out` : `./${actualFilename}.out`;
  }

  const filepath = path.join(tmpDir, `${actualFilename}${ext}`);
  const inputpath = path.join(tmpDir, `${filename}.in`);

  await fs.writeFile(filepath, code);
  await fs.writeFile(inputpath, input || '');

  let stdout = '';
  let stderr = '';
  let compileError = '';
  const startTime = process.hrtime();

  try {
    // Compile step
    if (compileCommand) {
      try {
        await execAsync(compileCommand, { cwd: tmpDir, timeout: 5000 });
      } catch (err: any) {
        compileError = err.stderr || err.message;
        throw new Error('Compilation Failed');
      }
    }

    // Run step
    const { stdout: resOut, stderr: resErr } = await execAsync(`${command} < ${filename}.in`, {
      cwd: tmpDir,
      timeout: 5000, 
    });
    stdout = resOut;
    stderr = resErr;
  } catch (error: any) {
    if (error.message !== 'Compilation Failed') {
      stdout = error.stdout || '';
      stderr = error.stderr || error.message;
    }
  } finally {
    const endTime = process.hrtime(startTime);
    // Cleanup
    try {
      await fs.unlink(filepath).catch(() => {});
      await fs.unlink(inputpath).catch(() => {});
      const outFiles = [`${actualFilename}.out`, `${actualFilename}.exe`, `${actualFilename}.class`];
      for (const f of outFiles) {
        await fs.unlink(path.join(tmpDir, f)).catch(() => {});
      }
    } catch (e) {}
    
    return {
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      compileError: compileError.trim(),
      time: (endTime[0] + endTime[1] / 1e9).toFixed(2),
      memory: 0,
      statusCode: 200,
    };
  }
}

export async function executeCode(code: string, language: string, input: string) {
  const engine = process.env.EXECUTION_ENGINE || 'jdoodle';
  
  if (engine === 'local') {
    return runWithLocal(code, language, input);
  } else if (engine === 'judge0') {
    return runWithJudge0(code, language, input);
  } else {
    return runWithJDoodle(code, language, input);
  }
}
