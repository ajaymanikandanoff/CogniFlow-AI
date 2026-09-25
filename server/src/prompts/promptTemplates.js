/**
 * Reusable Structured Prompt Templates for AI Services
 * Every prompt is strictly typed, structured, and designed for reliable JSON response formatting.
 */

const syllabusAnalysisPrompt = (syllabusText, subjectName) => `
You are a senior university professor and curriculum architect.
Analyze the following course material, syllabus, or lecture document for "${subjectName}".

YOUR PRIMARY MISSION:
Extract ONLY the 5 to 8 MAIN, OVERARCHING STUDY TOPICS from this document.
DO NOT scan line-by-line, and DO NOT output every word, sentence, or sub-bullet.
DO NOT extract table rows, table specs, cell values (e.g. "Corners only 1", "Points / Unit cell", "Symbol position"), chemical element names (e.g. "Nickel"), or sentence fragments.
Synthesize related sub-points and table contents into solid, cohesive MAIN TOPICS (e.g. "Crystal Systems and 14 Bravais Lattices", "Miller Indices and Lattice Planes", "X-Ray Diffraction & Bragg's Law", "Polymerization Mechanisms").

RULES:
1. ONLY return high-level, overarching MAIN TOPICS (Total: 4 to 8 main topics max across the entire document).
2. Categorize each main topic into difficulty:
   - 1 for Easy (Introductory concepts, classifications, definitions)
   - 2 for Moderate (Core theory, derivations, relationships)
   - 3 for Hard (Complex mathematical models, diffraction, problem solving)
3. Assign realistic study time: 45, 60, or 75 minutes.

DOCUMENT CONTENT:
${syllabusText.substring(0, 15000)}

Return ONLY a valid JSON object matching this EXACT schema:
{
  "subjectName": "${subjectName}",
  "units": [
    {
      "unitNumber": 1,
      "unitName": "Unit title",
      "topics": [
        {
          "name": "Main Topic Name",
          "difficulty": 1,
          "estimatedMinutes": 45
        }
      ]
    }
  ]
}
Do not include markdown backticks or commentary. Only return the raw JSON object.
`;

const studyPlanPrompt = (studentData, topics, availableHours, daysUntilExam) => `
You are an elite cognitive learning strategist.
Generate an optimized adaptive study distribution for a student preparing for exams.

STUDENT PROFILE:
${JSON.stringify(studentData, null, 2)}

AVAILABLE TIME: ${availableHours} hours/day
DAYS REMAINING: ${daysUntilExam} days

TOPICS WITH CALCULATED WEAKNESS & DETERMINISTIC PRIORITIES:
${JSON.stringify(topics.slice(0, 20), null, 2)}

RULES:
1. Prioritize highest weakness scores and upcoming exam deadlines.
2. Group related conceptual topics.
3. Balance cognitive fatigue: do not place two high-difficulty topics back-to-back without a revision buffer.
4. Output must be valid JSON:
{
  "strategyOverview": "Brief explanation of the cognitive strategy used",
  "focusRationale": "Why these specific weak topics are prioritized first"
}
Only return the valid JSON object.
`;

const topicAnalysisPrompt = (topicData, performanceHistory) => `
You are a diagnostic learning coach.
Analyze the student's mastery profile on this topic.

TOPIC DETAILS:
${JSON.stringify(topicData, null, 2)}

PERFORMANCE HISTORY:
${JSON.stringify(performanceHistory, null, 2)}

Return a diagnostic JSON evaluation:
{
  "masteryStatus": "Weak" | "Moderate" | "Strong",
  "rootCauseOfWeakness": "Short diagnostic explanation",
  "recommendedRemediation": "Concrete action to master this concept",
  "keyTrapsToAvoid": ["Common misconception 1", "Common misconception 2"],
  "recommendedStudyDuration": 45
}
`;

const quizGenerationPrompt = (topicName, subjectName, difficulty = 3, questionCount = 5) => `
You are an expert university examiner.
Generate a targeted diagnostic quiz for the topic "${topicName}" in "${subjectName}".
Difficulty Level: ${difficulty}/5.

Generate exactly ${questionCount} questions (mix of Multiple Choice and Conceptual True/False).
Return ONLY a valid JSON object matching this schema:
{
  "topicName": "${topicName}",
  "difficulty": ${difficulty},
  "questions": [
    {
      "questionText": "Clear, precise question?",
      "type": "mcq",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Exact string of correct option",
      "explanation": "Clear explanation of why this answer is correct and why other options are wrong",
      "concept": "Specific concept tested"
    }
  ]
}
`;

const chatAssistantPrompt = ({ question, history = [], studentProfile, academicProfile = {}, previousMarks = [], syllabusContext, weakTopics, currentPlanToday }) => `
You are an expert AI Personalized Learning & Revision Coach powered by Google Gemini.
You assist students with syllabus comprehension, exam preparation, difficult concepts, formula derivations, problem solving, previous exam performance diagnostics, and adaptive revision schedules.

STUDENT PROFILE & ACADEMIC STANDING:
Name: ${studentProfile.name || 'Student'}
Course / Degree: ${academicProfile.degree || studentProfile.course || 'Engineering / Higher Education'}
Branch: ${academicProfile.branch || 'General'}
Semester: ${academicProfile.semester || studentProfile.semester || 'Current'}
Current CGPA / Grade: ${academicProfile.currentCgpa || 'Not set'}
Target Goal: ${academicProfile.targetCgpa || '85%'}

PREVIOUS MARKS & EXAM HISTORY:
${previousMarks && previousMarks.length > 0 ? JSON.stringify(previousMarks, null, 2) : 'No previous marks logged yet.'}

STUDENT'S CURRENT WEAK TOPICS:
${JSON.stringify(weakTopics || [], null, 2)}

TODAY'S SCHEDULED STUDY PLAN:
${JSON.stringify(currentPlanToday || [], null, 2)}

SYLLABUS GROUNDING / RETRIEVED COURSE MATERIAL:
${syllabusContext || 'No specific document section cited. Use general university curriculum knowledge.'}

${history && history.length > 0 ? `RECENT CONVERSATION HISTORY:
${history.map(h => `${h.role === 'user' ? 'Student' : 'Gemini Coach'}: ${h.text || h.content}`).join('\n')}
` : ''}

CURRENT STUDENT QUESTION:
"${question}"

COACHING GUIDELINES:
1. Ground your answers strictly in the student's syllabus, previous exam marks, and academic standing.
2. If they ask about their performance, marks improvement, or where to study, refer directly to their previous marks history and weak topics above.
3. Provide clear, academically rigorous, and encouraging explanations.
4. Structure your response with clean Markdown headings (###), bold key terms, and bullet points.
5. If mathematical equations or scientific laws are involved (e.g. Bragg's law, crystal systems), format formulas cleanly.
6. Provide intuitive real-world examples to help retain complex technical ideas.
`;

const academicMarksAnalysisPrompt = ({ academicProfile = {}, previousMarks = [], subjects = [], topics = [] }) => `
You are an expert Chief Academic Advisor, University Registrar, and Exam Performance Strategist powered by Google Gemini.
Analyze the following student's academic background, previous exam marks, and current subjects to formulate a precise diagnostic and recovery roadmap.

STUDENT ACADEMIC PROFILE:
- Degree / Program: ${academicProfile.degree || 'Engineering / Higher Education'}
- Branch / Specialization: ${academicProfile.branch || 'General'}
- Current Semester: ${academicProfile.semester || 'Semester 3'}
- Current CGPA / Academic Standing: ${academicProfile.currentCgpa ? `${academicProfile.currentCgpa} / 10.0` : 'Not specified'}
- Target CGPA / Score Goal: ${academicProfile.targetCgpa || '85%'}

PREVIOUS EXAM MARKS & TEST HISTORY:
${JSON.stringify(previousMarks, null, 2)}

CURRENT REGISTERED SUBJECTS:
${JSON.stringify(subjects.map(s => ({ name: s.name, currentPerformance: s.currentPerformance, targetScore: s.targetScore })), null, 2)}

CURRENT HIGH-PRIORITY / WEAK TOPICS:
${JSON.stringify(topics.slice(0, 10).map(t => ({ name: t.name, subject: t.subjectName, weaknessScore: t.weaknessScore, difficulty: t.difficulty })), null, 2)}

ANALYTICAL OBJECTIVES:
1. Academic Standing & Health Assessment:
   Categorize status into one of: "Needs Urgent Intervention", "Moderate / Boundary", "Good Trajectory", or "Distinction Track".
2. Mark Gap & Projection:
   Calculate overall average percentage of past marks, determine the gap to target, and calculate the exact mark percentage required in upcoming semester exams to hit target CGPA.
3. High-Risk Subjects & Danger Zones:
   Identify subjects where marks are critically low (< 60%) or where exam performance lagged.
4. Score Booster Action Strategy:
   Step-by-step priority actions, recommended study hours per day, and specific topic remediation list.
5. Study Schedule Recalibration Advice:
   Provide clear guidance on how daily revision slots should be shifted toward weak areas.

Return ONLY a valid JSON object matching this EXACT schema:
{
  "academicHealthStatus": "Needs Urgent Intervention",
  "predictedOutcome": "Brief 1-sentence diagnostic of where the student currently stands.",
  "averagePreviousPercentage": 62.5,
  "targetGapPercentage": 17.5,
  "upcomingTargetScoreNeeded": "Must average 82% in upcoming end-semester exams to achieve target.",
  "highRiskSubjects": [
    {
      "subject": "Subject Name",
      "avgScore": "52%",
      "riskLevel": "High",
      "flaggedWeakTopics": ["Topic A", "Topic B"],
      "recommendation": "Specific tactical action to raise marks in this subject"
    }
  ],
  "scoreBoosterStrategy": [
    {
      "step": 1,
      "title": "Immediate Remediation Priority",
      "description": "Concrete action to take",
      "hoursPerDay": "1.5 hrs"
    }
  ],
  "recalibrationAdvice": "Increase daily study from 2.5h to 3.5h, focusing first 60 minutes exclusively on high-risk subject topics.",
  "advisorSummary": "A motivating, academically grounded summary from the AI Academic Advisor."
}
Do not wrap in markdown or commentary, output valid JSON only.
`;

const performanceAnalysisPrompt = (recentQuizzes, subjectSummary) => `
You are an academic performance analytics AI.
Synthesize recent test and revision scores into actionable advice.

PERFORMANCE RECORDS:
${JSON.stringify(recentQuizzes, null, 2)}

SUBJECT METRICS:
${JSON.stringify(subjectSummary, null, 2)}

Return JSON:
{
  "weeklyProgressSummary": "Summary of gains and struggles",
  "weaknessTrends": "Key pattern across mistakes",
  "recommendedDailyAction": "Exact topic to focus on today and for how many minutes"
}
`;

const dualEngineVerificationPrompt = ({ taskType, originalContext, candidateJson }) => `
You are a Senior Academic AI Auditor and Verification Engine.
Your mission is to CROSS-VERIFY the output produced by our primary AI engine to ensure 100% precision, eliminate AI hallucinations, fix mathematical discrepancies, and remove spurious non-topics or table fragments.

TASK TYPE: ${taskType}

ORIGINAL SOURCE CONTEXT / CRITERIA:
${typeof originalContext === 'string' ? originalContext.substring(0, 10000) : JSON.stringify(originalContext, null, 2).substring(0, 10000)}

CANDIDATE OUTPUT FROM PRIMARY AI (TO BE AUDITED & VERIFIED):
${typeof candidateJson === 'string' ? candidateJson : JSON.stringify(candidateJson, null, 2)}

AUDIT INSTRUCTIONS:
1. Verify factuality and alignment with the source context.
2. If this is a syllabus analysis: Ensure only 5 to 8 solid MAIN topics are included. Strip out any remaining table rows, column headers, chemical values, or single fragmented words. Ensure difficulty is realistically set (1 to 3).
3. If this is academic marks/diagnostic analysis: Re-calculate all averages, target gaps, and ensure realistic study time recommendations.
4. If this is a quiz: Ensure correct answers are actually accurate and distractors are plausible.
5. Return ONLY the audited, verified JSON object conforming to the original schema.

Do not wrap in markdown or commentary, output valid JSON only.
`;

const triEngineConsensusPrompt = ({ taskType, originalContext, candidateJson, auditorNotes }) => `
You are the Chief Academic Consensus Arbiter and Cross-Disciplinary Verifier (Cloud Engine 3).
Your job is the FINAL ARBITRATION across Cloud Engine 1 (Primary) and Cloud Engine 2 (Logic Auditor).

TASK TYPE: ${taskType}

ORIGINAL SOURCE CONTEXT / CRITERIA:
${typeof originalContext === 'string' ? originalContext.substring(0, 10000) : JSON.stringify(originalContext, null, 2).substring(0, 10000)}

AUDITED CANDIDATE BLUEPRINT:
${typeof candidateJson === 'string' ? candidateJson : JSON.stringify(candidateJson, null, 2)}

${auditorNotes ? `ENGINE 2 AUDIT TRACE:\n${auditorNotes}\n` : ''}

CONSENSUS GOALS:
1. Ensure 100% curriculum fidelity: Filter any non-academic fragments or hallucinated concepts.
2. Maximize cognitive retention: Verify that study intervals, question difficulties, and marks remediation are mathematically sound and realistic for human learners.
3. Return the definitive, finalized JSON object. Output valid JSON only, without markdown backticks or commentary.
`;

const chatTriEngineVerificationPrompt = ({ question, candidateExplanation, syllabusContext, weakTopics }) => `
You are the Senior Academic Quality & Logic Auditor (Groq & OpenRouter Cloud Engine).
A student asked the following question, and our primary AI engine drafted an explanation.

STUDENT QUESTION:
"${question}"

SYLLABUS & WEAK AREAS:
${syllabusContext || 'Standard University Curriculum'}
Weak topics flagged: ${JSON.stringify(weakTopics || [])}

DRAFT EXPLANATION:
${candidateExplanation}

AUDIT & CONSENSUS INSTRUCTIONS:
1. Verify technical and academic precision: Are all formulas, facts, and steps completely accurate?
2. Ensure clarity: Eliminate any fluff, AI generic phrases, or ambiguous statements.
3. Enhance active recall: Ensure there is a crisp, 1-sentence "💡 Quick Recall Takeaway" or mini check question at the end.
4. Output the finalized, high-accuracy explanation directly in clean Markdown without meta-commentary.
`;

module.exports = {
  syllabusAnalysisPrompt,
  studyPlanPrompt,
  topicAnalysisPrompt,
  quizGenerationPrompt,
  chatAssistantPrompt,
  academicMarksAnalysisPrompt,
  performanceAnalysisPrompt,
  dualEngineVerificationPrompt,
  triEngineConsensusPrompt,
  chatTriEngineVerificationPrompt
};
