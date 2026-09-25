const pdfParse = require('pdf-parse');
const store = require('../data/store');
const { analyzeSyllabusWithPython } = require('../services/pythonAnalyzerService');
const { parseSyllabusWithAI } = require('../services/aiService');
const { calculateWeaknessScore, calculatePriority } = require('../services/priorityAlgorithm');
const { generatePlanForUser } = require('./plannerController');

exports.uploadSyllabus = async (req, res, next) => {
  try {
    const { subjectId, subjectName, rawText } = req.body;
    const effectiveSubjectName = subjectName || 'Extracted Course';

    if (!req.file && (!rawText || rawText.trim().length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'No syllabus content provided. Please upload a PDF or paste text.'
      });
    }

    let parsedStructure = null;
    let extractedTextLength = 0;

    // 1. Primary engine: Python pypdf extractor + Gemini AI Analyzer
    try {
      console.log(`[Syllabus] Initiating Python pypdf text extraction and Gemini AI analysis for '${effectiveSubjectName}'...`);
      const pythonResult = await analyzeSyllabusWithPython({
        fileBuffer: req.file ? req.file.buffer : undefined,
        fileName: req.file ? req.file.originalname : 'syllabus.txt',
        rawText: rawText || undefined,
        subjectName: effectiveSubjectName
      });

      if (pythonResult && pythonResult.units && pythonResult.units.length > 0) {
        parsedStructure = {
          subjectName: pythonResult.subjectName || effectiveSubjectName,
          units: pythonResult.units
        };
        extractedTextLength = pythonResult.extractedTextLength || 1000;
        console.log(`[Syllabus] Python extraction and Gemini analysis succeeded with ${pythonResult.units.length} units.`);
      }
    } catch (pyErr) {
      console.warn('[Syllabus] Python analyzer error, falling back to JS AI parser:', pyErr.message);
    }

    // 2. Fallback if Python engine could not parse
    if (!parsedStructure) {
      let extractedText = rawText || '';
      if (req.file) {
        if (req.file.mimetype === 'application/pdf' || req.file.originalname.endsWith('.pdf')) {
          try {
            const pdfData = await pdfParse(req.file.buffer);
            extractedText = pdfData.text;
          } catch (pdfErr) {
            extractedText = req.file.buffer.toString('utf-8');
          }
        } else {
          extractedText = req.file.buffer.toString('utf-8');
        }
      }

      parsedStructure = await parseSyllabusWithAI(extractedText, effectiveSubjectName);
      extractedTextLength = extractedText.length;
    }

    res.json({
      success: true,
      message: 'Syllabus successfully extracted and analyzed via Python & Gemini AI. Please review your topics before finalizing.',
      extractedTextLength,
      parsedStructure
    });
  } catch (error) {
    next(error);
  }
};

exports.saveParsedSyllabus = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { subjectId, subjectName, examDate, units } = req.body;

    let targetSubjectId = subjectId;
    let subject;

    if (targetSubjectId) {
      subject = store.findById('subjects', targetSubjectId);
    }

    if (!subject) {
      subject = store.insert('subjects', {
        userId,
        name: subjectName || 'New Course',
        examDate: examDate ? new Date(examDate).toISOString() : new Date(Date.now() + 15 * 86400000).toISOString(),
        targetScore: 85,
        currentPerformance: 65,
        completionPercentage: 0
      });
      targetSubjectId = subject._id;
    }

    // Delete existing topics for this subject to replace with confirmed syllabus
    store.delete('topics', { subjectId: targetSubjectId, userId });

    const insertedTopics = [];
    let daysUntilExam = 14;
    if (subject.examDate) {
      daysUntilExam = Math.max(1, Math.ceil((new Date(subject.examDate) - new Date()) / (1000 * 60 * 60 * 24)));
    }

    if (Array.isArray(units)) {
      units.forEach(unit => {
        if (Array.isArray(unit.topics)) {
          unit.topics.forEach(t => {
            const difficulty = t.difficulty ? parseInt(t.difficulty) : 3;
            const weaknessScore = calculateWeaknessScore({
              accuracy: 65,
              topicDifficulty: difficulty,
              daysUntilExam,
              daysSinceLastRevision: 0,
              mistakeCount: 0,
              confidenceLevel: 'medium'
            });

            const priority = calculatePriority({
              weaknessScore,
              daysUntilExam,
              topicDifficulty: difficulty,
              daysSinceLastRevision: 0,
              revisionDue: false,
              mistakeCount: 0
            });

            const inserted = store.insert('topics', {
              userId,
              subjectId: targetSubjectId,
              subjectName: subject.name,
              unitNumber: unit.unitNumber || 1,
              unitName: unit.unitName || `Unit ${unit.unitNumber || 1}`,
              name: t.name,
              subtopics: t.subtopics || [],
              keyConcepts: t.keyConcepts || [],
              difficulty,
              estimatedMinutes: t.estimatedMinutes ? parseInt(t.estimatedMinutes) : 60,
              status: 'Not Started',
              weaknessScore,
              priority,
              accuracy: 65,
              mistakeCount: 0,
              confidenceLevel: 'medium',
              lastStudiedAt: null,
              nextRevisionDate: null,
              revisionIntervalIndex: 0,
              isRevisionDue: false
            });
            insertedTopics.push(inserted);
          });
        }
      });
    }

    store.update('subjects', { _id: targetSubjectId }, {
      topicsCount: insertedTopics.length,
      unitsCount: units ? units.length : 1
    });

    if (insertedTopics.length > 0) {
      await generatePlanForUser(userId);
    }

    res.status(201).json({
      success: true,
      message: `Successfully structured ${insertedTopics.length} topics across ${units ? units.length : 1} units.`,
      subject,
      topicsCount: insertedTopics.length
    });
  } catch (error) {
    next(error);
  }
};
