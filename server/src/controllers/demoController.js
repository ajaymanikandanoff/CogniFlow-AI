const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const store = require('../data/store');
const { generateAdaptiveStudyPlan } = require('../services/adaptivePlanner');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_study_coach_key_2026';

exports.loadDemoData = async (req, res, next) => {
  try {
    const demoEmail = 'alex.student@hackathon.edu';
    
    // Clean existing demo user data if present
    const existing = store.findOne('users', { email: demoEmail });
    if (existing) {
      const uId = existing._id;
      store.delete('subjects', { userId: uId });
      store.delete('topics', { userId: uId });
      store.delete('studyPlans', { userId: uId });
      store.delete('revisions', { userId: uId });
      store.delete('quizzes', { userId: uId });
      store.delete('quizAttempts', { userId: uId });
      store.delete('performances', { userId: uId });
      store.delete('notifications', { userId: uId });
      store.delete('studentProfiles', { userId: uId });
      store.delete('users', { _id: uId });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('demo1234', salt);

    const user = store.insert('users', {
      name: 'Alex Chen',
      email: demoEmail,
      password: hashedPassword,
      role: 'student'
    });

    const profile = store.insert('studentProfiles', {
      userId: user._id,
      name: 'Alex Chen',
      email: demoEmail,
      course: 'B.Tech Computer Science & Engineering',
      semester: '6th Semester',
      dailyAvailableHours: 3.5,
      preferredStudyTime: 'morning',
      learningPreferences: {
        focusSessionDuration: 45,
        breakDuration: 10,
        learningStyle: 'visual_and_practice',
        adaptiveFrequency: 'high'
      },
      onboardingCompleted: true
    });

    // Dates calculation
    const now = new Date();
    const d10 = new Date(now.getTime() + 10 * 86400000).toISOString();
    const d15 = new Date(now.getTime() + 15 * 86400000).toISOString();
    const d20 = new Date(now.getTime() + 20 * 86400000).toISOString();
    const d25 = new Date(now.getTime() + 25 * 86400000).toISOString();

    // 1. Subjects
    const subDBMS = store.insert('subjects', {
      userId: user._id,
      name: 'Database Management Systems',
      code: 'CS601',
      examDate: d10,
      targetScore: 85,
      currentPerformance: 58,
      completionPercentage: 55,
      unitsCount: 3,
      topicsCount: 5
    });

    const subOS = store.insert('subjects', {
      userId: user._id,
      name: 'Operating Systems',
      code: 'CS602',
      examDate: d15,
      targetScore: 80,
      currentPerformance: 72,
      completionPercentage: 68,
      unitsCount: 3,
      topicsCount: 4
    });

    const subCN = store.insert('subjects', {
      userId: user._id,
      name: 'Computer Networks',
      code: 'CS603',
      examDate: d20,
      targetScore: 75,
      currentPerformance: 45,
      completionPercentage: 35,
      unitsCount: 3,
      topicsCount: 4
    });

    const subAI = store.insert('subjects', {
      userId: user._id,
      name: 'Artificial Intelligence',
      code: 'CS604',
      examDate: d25,
      targetScore: 90,
      currentPerformance: 84,
      completionPercentage: 80,
      unitsCount: 2,
      topicsCount: 3
    });

    const subjects = [subDBMS, subOS, subCN, subAI];

    // 2. Topics (including weak topics: Normalization, TCP Congestion Control, Deadlocks)
    const topicDefs = [
      // DBMS
      { subjectId: subDBMS._id, subjectName: subDBMS.name, unitNumber: 1, unitName: 'Relational Design & Theory', name: 'Normalization', difficulty: 5, weaknessScore: 87, priority: 92, accuracy: 42, status: 'Needs Revision' },
      { subjectId: subDBMS._id, subjectName: subDBMS.name, unitNumber: 1, unitName: 'Relational Design & Theory', name: 'Functional Dependencies', difficulty: 4, weaknessScore: 76, priority: 80, accuracy: 50, status: 'In Progress' },
      { subjectId: subDBMS._id, subjectName: subDBMS.name, unitNumber: 2, unitName: 'Query Languages', name: 'SQL Joins & Subqueries', difficulty: 3, weaknessScore: 68, priority: 72, accuracy: 62, status: 'In Progress' },
      { subjectId: subDBMS._id, subjectName: subDBMS.name, unitNumber: 2, unitName: 'Query Languages', name: 'Relational Algebra', difficulty: 3, weaknessScore: 58, priority: 61, accuracy: 70, status: 'Completed' },
      { subjectId: subDBMS._id, subjectName: subDBMS.name, unitNumber: 3, unitName: 'Storage & Architecture', name: 'DBMS 3-Schema Architecture', difficulty: 2, weaknessScore: 32, priority: 38, accuracy: 88, status: 'Completed' },
      // OS
      { subjectId: subOS._id, subjectName: subOS.name, unitNumber: 1, unitName: 'Concurrency & Synchronization', name: 'Deadlock Avoidance & Banker Algorithm', difficulty: 4, weaknessScore: 74, priority: 79, accuracy: 48, status: 'Needs Revision' },
      { subjectId: subOS._id, subjectName: subOS.name, unitNumber: 1, unitName: 'Concurrency & Synchronization', name: 'Process Synchronization & Semaphores', difficulty: 4, weaknessScore: 62, priority: 66, accuracy: 65, status: 'In Progress' },
      { subjectId: subOS._id, subjectName: subOS.name, unitNumber: 2, unitName: 'Memory Management', name: 'Virtual Memory & Page Replacement', difficulty: 3, weaknessScore: 40, priority: 45, accuracy: 78, status: 'Completed' },
      { subjectId: subOS._id, subjectName: subOS.name, unitNumber: 3, unitName: 'File Systems', name: 'Disk Scheduling Algorithms', difficulty: 2, weaknessScore: 28, priority: 35, accuracy: 92, status: 'Completed' },
      // CN
      { subjectId: subCN._id, subjectName: subCN.name, unitNumber: 1, unitName: 'Transport Layer', name: 'TCP Congestion Control & Flow Control', difficulty: 5, weaknessScore: 82, priority: 88, accuracy: 38, status: 'Needs Revision' },
      { subjectId: subCN._id, subjectName: subCN.name, unitNumber: 1, unitName: 'Transport Layer', name: 'TCP vs UDP Protocols', difficulty: 2, weaknessScore: 35, priority: 42, accuracy: 85, status: 'Completed' },
      { subjectId: subCN._id, subjectName: subCN.name, unitNumber: 2, unitName: 'Network Layer', name: 'IP Subnetting & CIDR', difficulty: 4, weaknessScore: 70, priority: 75, accuracy: 54, status: 'In Progress' },
      { subjectId: subCN._id, subjectName: subCN.name, unitNumber: 3, unitName: 'Routing Protocols', name: 'Distance Vector vs Link State Routing', difficulty: 3, weaknessScore: 52, priority: 58, accuracy: 68, status: 'Not Started' },
      // AI
      { subjectId: subAI._id, subjectName: subAI.name, unitNumber: 1, unitName: 'Search Strategies', name: 'A* Search & Heuristics', difficulty: 3, weaknessScore: 30, priority: 38, accuracy: 88, status: 'Completed' },
      { subjectId: subAI._id, subjectName: subAI.name, unitNumber: 2, unitName: 'Adversarial Search', name: 'Minimax & Alpha-Beta Pruning', difficulty: 3, weaknessScore: 34, priority: 40, accuracy: 82, status: 'Completed' }
    ];

    const insertedTopics = [];
    topicDefs.forEach(td => {
      const ins = store.insert('topics', {
        userId: user._id,
        ...td,
        subtopics: [`Core theorems of ${td.name}`, `Numerical examples and problems`],
        keyConcepts: [td.name, 'Practical Applications'],
        estimatedMinutes: td.difficulty > 3 ? 60 : 45,
        mistakeCount: td.weaknessScore > 70 ? 3 : 1,
        confidenceLevel: td.weaknessScore > 70 ? 'low' : td.weaknessScore > 40 ? 'medium' : 'high',
        lastStudiedAt: new Date(now.getTime() - 2 * 86400000).toISOString(),
        nextRevisionDate: new Date(now.getTime() + 1 * 86400000).toISOString().split('T')[0],
        revisionIntervalIndex: 1,
        isRevisionDue: td.weaknessScore >= 70
      });
      insertedTopics.push(ins);
    });

    // 3. Generate initial Study Plan
    const { plan } = generateAdaptiveStudyPlan({
      student: profile,
      subjects,
      topics: insertedTopics,
      availableHoursPerDay: 3.5,
      startDate: now
    });

    const savedPlan = store.insert('studyPlans', {
      userId: user._id,
      generatedAt: now.toISOString(),
      days: plan,
      activeAdaptationLog: [
        {
          timestamp: now.toISOString(),
          trigger: 'Initial AI Diagnostics',
          changeDescription: 'Prioritized Normalization and TCP Congestion Control due to <50% quiz scores and 10-day exam countdown.'
        }
      ]
    });

    // 4. Revisions
    const todayStr = now.toISOString().split('T')[0];
    const tomorrowStr = new Date(now.getTime() + 86400000).toISOString().split('T')[0];

    store.insert('revisions', {
      userId: user._id,
      topicId: insertedTopics[0]._id,
      topicName: 'Normalization',
      subjectName: 'Database Management Systems',
      dueDate: todayStr,
      status: 'due',
      previousScore: 42,
      currentPriority: 92,
      recommendedDurationMinutes: 45
    });

    store.insert('revisions', {
      userId: user._id,
      topicId: insertedTopics[5]._id,
      topicName: 'Deadlock Avoidance & Banker Algorithm',
      subjectName: 'Operating Systems',
      dueDate: todayStr,
      status: 'due',
      previousScore: 48,
      currentPriority: 79,
      recommendedDurationMinutes: 40
    });

    store.insert('revisions', {
      userId: user._id,
      topicId: insertedTopics[9]._id,
      topicName: 'TCP Congestion Control & Flow Control',
      subjectName: 'Computer Networks',
      dueDate: tomorrowStr,
      status: 'upcoming',
      previousScore: 38,
      currentPriority: 88,
      recommendedDurationMinutes: 45
    });

    // 5. In-App Notifications
    store.insert('notifications', {
      userId: user._id,
      title: 'Adaptive Study Plan Active',
      message: 'Alex, your plan was tailored for DBMS in 10 days with heavy emphasis on Normalization (Weakness: 87).',
      type: 'plan_adapted'
    });

    store.insert('notifications', {
      userId: user._id,
      title: 'Revision Due Today',
      message: 'Normalization revision is due. Quick 15-minute spaced review recommended before today\'s quiz.',
      type: 'revision_due'
    });

    // Token
    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Hackathon Demo Mode loaded successfully for Alex!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      },
      profile,
      subjectsCount: subjects.length,
      topicsCount: insertedTopics.length,
      plan: savedPlan
    });
  } catch (error) {
    next(error);
  }
};
