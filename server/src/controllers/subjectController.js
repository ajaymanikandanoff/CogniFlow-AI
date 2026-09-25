const store = require('../data/store');
const { classifyTopic } = require('../services/priorityAlgorithm');
const { generatePlanForUser } = require('./plannerController');

exports.getSubjects = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const subjects = store.find('subjects', { userId });
    const topics = store.find('topics', { userId });

    const enriched = subjects.map(sub => {
      const subTopics = topics.filter(t => t.subjectId.toString() === sub._id.toString());
      const completed = subTopics.filter(t => t.status === 'Completed').length;
      const completionPercentage = subTopics.length > 0 ? Math.round((completed / subTopics.length) * 100) : 0;
      
      const now = new Date();
      const examDate = new Date(sub.examDate);
      const daysLeft = Math.max(0, Math.ceil((examDate - now) / (1000 * 60 * 60 * 24)));

      return {
        ...sub,
        topicsCount: subTopics.length,
        completedTopicsCount: completed,
        completionPercentage,
        daysLeft
      };
    });

    res.json({ success: true, subjects: enriched });
  } catch (error) {
    next(error);
  }
};

exports.createSubject = async (req, res, next) => {
  try {
    const { name, code, examDate, targetScore, currentPerformance, topics } = req.body;
    if (!name || !examDate) {
      return res.status(400).json({ success: false, message: 'Subject name and exam date are required' });
    }

    const newSubject = store.insert('subjects', {
      userId: req.user.id,
      name: name.trim(),
      code: code ? code.trim() : '',
      examDate: new Date(examDate).toISOString(),
      targetScore: targetScore ? parseInt(targetScore) : 85,
      currentPerformance: currentPerformance ? parseInt(currentPerformance) : 60,
      completionPercentage: 0
    });

    // If topics provided (comma separated string or array)
    let topicList = [];
    if (Array.isArray(topics)) {
      topicList = topics.map(t => typeof t === 'string' ? t.trim() : t.name).filter(Boolean);
    } else if (typeof topics === 'string') {
      topicList = topics.split(/[\n,]+/).map(t => t.trim()).filter(Boolean);
    }

    for (let i = 0; i < topicList.length; i++) {
      store.insert('topics', {
        userId: req.user.id,
        subjectId: newSubject._id,
        subjectName: newSubject.name,
        unitNumber: 1,
        unitName: 'General Topics',
        name: topicList[i],
        subtopics: [],
        difficulty: 3,
        importance: 3,
        estimatedHours: 1.5,
        status: 'Not Started',
        weaknessScore: 60,
        priority: 70
      });
    }

    if (topicList.length > 0) {
      await generatePlanForUser(req.user.id);
    }

    res.status(201).json({ success: true, subject: newSubject, topicsAdded: topicList.length });
  } catch (error) {
    next(error);
  }
};

exports.addTopicToSubject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, difficulty } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Topic name is required' });
    }

    const subject = store.findById('subjects', id);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    const newTopic = store.insert('topics', {
      userId: req.user.id,
      subjectId: subject._id,
      subjectName: subject.name,
      unitNumber: 1,
      unitName: 'General Topics',
      name: name.trim(),
      subtopics: [],
      difficulty: difficulty ? parseInt(difficulty) : 3,
      importance: 3,
      estimatedHours: 1.5,
      status: 'Not Started',
      weaknessScore: 60,
      priority: 70
    });

    await generatePlanForUser(req.user.id);

    res.status(201).json({ success: true, topic: newTopic });
  } catch (error) {
    next(error);
  }
};

exports.deleteTopic = async (req, res, next) => {
  try {
    const { topicId } = req.params;
    store.delete('topics', { _id: topicId, userId: req.user.id });
    await generatePlanForUser(req.user.id);
    res.json({ success: true, message: 'Topic deleted' });
  } catch (error) {
    next(error);
  }
};

exports.getSubjectById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const subject = store.findById('subjects', id);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    const topics = store.find('topics', { subjectId: id });
    const enrichedTopics = topics.map(t => ({
      ...t,
      classification: classifyTopic(t.weaknessScore, t.accuracy)
    }));

    // Group into units
    const unitsMap = {};
    enrichedTopics.forEach(t => {
      const uNum = t.unitNumber || 1;
      const uName = t.unitName || `Unit ${uNum}`;
      if (!unitsMap[uNum]) {
        unitsMap[uNum] = { unitNumber: uNum, unitName: uName, topics: [] };
      }
      unitsMap[uNum].topics.push(t);
    });

    const units = Object.values(unitsMap).sort((a, b) => a.unitNumber - b.unitNumber);

    res.json({
      success: true,
      subject,
      units,
      topics: enrichedTopics
    });
  } catch (error) {
    next(error);
  }
};

exports.updateSubject = async (req, res, next) => {
  try {
    const { id } = req.params;
    store.update('subjects', { _id: id, userId: req.user.id }, req.body);
    const updated = store.findById('subjects', id);
    res.json({ success: true, subject: updated });
  } catch (error) {
    next(error);
  }
};

exports.deleteSubject = async (req, res, next) => {
  try {
    const { id } = req.params;
    store.delete('subjects', { _id: id, userId: req.user.id });
    store.delete('topics', { subjectId: id, userId: req.user.id });
    await generatePlanForUser(req.user.id);
    res.json({ success: true, message: 'Subject and associated topics deleted' });
  } catch (error) {
    next(error);
  }
};
