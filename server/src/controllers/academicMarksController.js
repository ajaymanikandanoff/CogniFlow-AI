const store = require('../data/store');
const { analyzeAcademicAndPreviousMarksWithAI } = require('../services/aiService');
const { calculateWeaknessScore, calculatePriority } = require('../services/priorityAlgorithm');
const { generatePlanForUser } = require('./plannerController');

function calculateGrade(percentage) {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 40) return 'D';
  return 'F';
}

/**
 * GET /api/academic-marks/data
 * Returns academic profile, previous marks, current subjects, and latest AI analysis
 */
exports.getAcademicData = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Academic Profile
    let academicProfile = store.findOne('academicProfiles', { userId });
    if (!academicProfile) {
      const studentProfile = store.findOne('studentProfiles', { userId }) || {};
      academicProfile = {
        userId,
        degree: studentProfile.course || 'B.Tech Engineering',
        branch: 'Computer Science & Engineering',
        semester: studentProfile.semester || 'Semester 4',
        currentCgpa: '7.4',
        targetCgpa: '8.5'
      };
    }

    // Previous Marks
    const previousMarks = store.find('previousMarks', { userId })
      .sort((a, b) => new Date(b.recordedAt || 0) - new Date(a.recordedAt || 0));

    // Latest Analysis
    const analyses = store.find('academicAnalyses', { userId })
      .sort((a, b) => new Date(b.analyzedAt || 0) - new Date(a.analyzedAt || 0));
    const latestAnalysis = analyses[0] || null;

    // Current Subjects for context
    const subjects = store.find('subjects', { userId });

    res.json({
      success: true,
      academicProfile,
      previousMarks,
      latestAnalysis,
      subjectsCount: subjects.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/academic-marks/profile
 * Updates student degree, branch, semester, CGPA, and goals
 */
exports.saveAcademicProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { degree, branch, semester, currentCgpa, targetCgpa } = req.body;

    const existing = store.findOne('academicProfiles', { userId });
    let updated;

    if (existing) {
      updated = store.update('academicProfiles', { userId }, {
        degree: degree || existing.degree,
        branch: branch || existing.branch,
        semester: semester || existing.semester,
        currentCgpa: currentCgpa !== undefined ? currentCgpa : existing.currentCgpa,
        targetCgpa: targetCgpa !== undefined ? targetCgpa : existing.targetCgpa,
        updatedAt: new Date().toISOString()
      });
    } else {
      updated = store.insert('academicProfiles', {
        userId,
        degree: degree || 'B.Tech Engineering',
        branch: branch || 'General',
        semester: semester || 'Semester 4',
        currentCgpa: currentCgpa || '7.5',
        targetCgpa: targetCgpa || '8.5',
        updatedAt: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Academic profile successfully updated.',
      academicProfile: updated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/academic-marks/record
 * Adds or updates a previous test / exam mark
 */
exports.addPreviousMark = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { subjectName, examType, marksObtained, maxMarks, weakTopics, semester } = req.body;

    if (!subjectName || marksObtained === undefined || !maxMarks) {
      return res.status(400).json({
        success: false,
        message: 'Subject name, marks obtained, and maximum marks are required.'
      });
    }

    const obtained = parseFloat(marksObtained);
    const maximum = parseFloat(maxMarks);
    const percentage = Math.round((obtained / maximum) * 100);
    const grade = calculateGrade(percentage);

    const markRecord = store.insert('previousMarks', {
      userId,
      subjectName: subjectName.trim(),
      examType: examType || 'Internal Assessment 1',
      marksObtained: obtained,
      maxMarks: maximum,
      percentage,
      grade,
      weakTopics: Array.isArray(weakTopics) ? weakTopics : (weakTopics ? weakTopics.split(',').map(s => s.trim()).filter(Boolean) : []),
      semester: semester || 'Current',
      recordedAt: new Date().toISOString()
    });

    // Sync with existing subject's currentPerformance if found
    const matchingSubject = store.findOne('subjects', { userId, name: subjectName.trim() });
    if (matchingSubject) {
      store.update('subjects', { _id: matchingSubject._id }, {
        currentPerformance: percentage
      });
    }

    res.status(201).json({
      success: true,
      message: `Exam mark recorded for ${subjectName} (${percentage}% - ${grade}).`,
      mark: markRecord
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/academic-marks/record/:id
 * Removes a recorded exam mark
 */
exports.deletePreviousMark = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    store.delete('previousMarks', { _id: id, userId });

    res.json({
      success: true,
      message: 'Exam mark record deleted.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/academic-marks/analyze
 * Invokes Google Gemini API to analyze academic standing & historical marks,
 * and recalibrates topic priorities in the daily study plan.
 */
exports.analyzeAcademicAndMarks = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // 1. Gather all data
    let academicProfile = store.findOne('academicProfiles', { userId });
    if (!academicProfile) {
      const student = store.findOne('studentProfiles', { userId }) || {};
      academicProfile = {
        degree: student.course || 'B.Tech Engineering',
        branch: 'General',
        semester: student.semester || 'Semester 4',
        currentCgpa: '7.2',
        targetCgpa: '8.5'
      };
    }

    const previousMarks = store.find('previousMarks', { userId });
    const subjects = store.find('subjects', { userId });
    const topics = store.find('topics', { userId });

    // 2. Call Google Gemini AI Analyzer
    const analysisResult = await analyzeAcademicAndPreviousMarksWithAI({
      academicProfile,
      previousMarks,
      subjects,
      topics
    });

    // 3. Recalibrate Topic Weakness & Priority in the Study Planner
    // If a subject was marked as high risk or scored < 60%, boost its topics' weakness scores!
    let topicsRecalibratedCount = 0;
    if (analysisResult.highRiskSubjects && Array.isArray(analysisResult.highRiskSubjects)) {
      analysisResult.highRiskSubjects.forEach(riskSub => {
        const matchingSubject = subjects.find(s => 
          s.name.toLowerCase().includes(riskSub.subject.toLowerCase()) || 
          riskSub.subject.toLowerCase().includes(s.name.toLowerCase())
        );

        if (matchingSubject) {
          const subjectTopics = topics.filter(t => t.subjectId === matchingSubject._id);
          subjectTopics.forEach(t => {
            // Boost weakness score based on poor exam marks
            const newAccuracy = Math.min(t.accuracy || 60, 48);
            const boostedWeakness = calculateWeaknessScore({
              accuracy: newAccuracy,
              topicDifficulty: t.difficulty || 3,
              daysUntilExam: 10,
              daysSinceLastRevision: 0,
              mistakeCount: (t.mistakeCount || 0) + 2,
              confidenceLevel: 'low'
            });

            const newPriority = calculatePriority({
              weaknessScore: boostedWeakness,
              daysUntilExam: 10,
              topicDifficulty: t.difficulty || 3,
              daysSinceLastRevision: 0,
              revisionDue: true,
              mistakeCount: (t.mistakeCount || 0) + 2
            });

            store.update('topics', { _id: t._id }, {
              weaknessScore: boostedWeakness,
              priority: newPriority,
              accuracy: newAccuracy,
              confidenceLevel: 'low',
              isRevisionDue: true
            });
            topicsRecalibratedCount++;
          });
        }
      });

      // Regenerate daily plan so the schedule immediately reflects the recalibrated marks!
      if (topicsRecalibratedCount > 0) {
        await generatePlanForUser(userId);
      }
    }

    // 4. Save analysis record
    const savedAnalysis = store.insert('academicAnalyses', {
      userId,
      ...analysisResult,
      topicsRecalibratedCount,
      analyzedAt: new Date().toISOString()
    });

    res.json({
      success: true,
      message: `Google Gemini AI successfully diagnosed academic standing and previous marks. Recalibrated ${topicsRecalibratedCount} syllabus topics in your study plan.`,
      analysis: savedAnalysis
    });
  } catch (error) {
    next(error);
  }
};
