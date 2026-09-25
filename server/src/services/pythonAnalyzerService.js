const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

/**
 * Executes the Python PDF text extractor and Gemini AI syllabus analyzer
 * @param {Object} options
 * @param {Buffer} [options.fileBuffer] - Uploaded PDF or text file buffer
 * @param {string} [options.fileName] - Original file name (e.g. syllabus.pdf)
 * @param {string} [options.rawText] - Direct text if pasted instead of file upload
 * @param {string} [options.subjectName] - Name of the course/subject
 * @returns {Promise<Object>}
 */
async function analyzeSyllabusWithPython({ fileBuffer, fileName = 'syllabus.pdf', rawText, subjectName = 'Course Syllabus' }) {
  const uploadsDir = path.join(__dirname, '../../uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const extension = fileName.toLowerCase().endsWith('.pdf') ? '.pdf' : '.txt';
  const tempFileName = `upload_${Date.now()}_${Math.random().toString(36).substring(7)}${extension}`;
  const tempFilePath = path.join(uploadsDir, tempFileName);

  try {
    if (fileBuffer) {
      fs.writeFileSync(tempFilePath, fileBuffer);
    } else if (rawText) {
      fs.writeFileSync(tempFilePath, rawText, 'utf-8');
    } else {
      throw new Error('Neither file buffer nor text was provided for Python extraction');
    }

    const scriptPath = path.join(__dirname, 'python_analyzer.py');
    const geminiApiKey = process.env.GEMINI_API_KEY || '';
    const openAiApiKey = process.env.OPENAI_API_KEY || '';

    const pythonArgs = [scriptPath, tempFilePath, subjectName, geminiApiKey, openAiApiKey];

    const resultJson = await new Promise((resolve, reject) => {
      execFile('python', pythonArgs, { maxBuffer: 10 * 1024 * 1024, timeout: 45000 }, (error, stdout, stderr) => {
        if (error) {
          console.warn('[Python Analyzer Warning]:', stderr || error.message);
          // If python command failed, try python3
          execFile('python3', pythonArgs, { maxBuffer: 10 * 1024 * 1024, timeout: 45000 }, (err3, stdout3, stderr3) => {
            if (err3) {
              return reject(new Error(stderr3 || err3.message));
            }
            try {
              resolve(JSON.parse(stdout3.trim()));
            } catch (pErr) {
              reject(new Error(`Failed to parse Python output: ${pErr.message}`));
            }
          });
          return;
        }

        try {
          const parsed = JSON.parse(stdout.trim());
          resolve(parsed);
        } catch (pErr) {
          reject(new Error(`Failed to parse Python output: ${pErr.message} -- Raw output: ${stdout.slice(0, 300)}`));
        }
      });
    });

    return resultJson;
  } finally {
    // Clean up temporary file
    try {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    } catch (cleanupErr) {
      console.warn('Failed to clean up temp file:', tempFilePath, cleanupErr.message);
    }
  }
}

module.exports = {
  analyzeSyllabusWithPython
};
