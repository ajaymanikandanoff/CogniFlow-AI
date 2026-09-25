const API_BASE = '/api';

function getHeaders() {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: getHeaders(),
    ...options
  };

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }
  return data;
}

export const api = {
  // Auth
  register: (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  getMe: () => request('/auth/me'),

  // Student & Dashboard
  getProfile: () => request('/student/profile'),
  updateProfile: (payload) => request('/student/profile', { method: 'PUT', body: JSON.stringify(payload) }),
  getDashboard: () => request('/student/dashboard'),
  sendScheduleNotification: (payload) => request('/student/schedule-notification', { method: 'POST', body: JSON.stringify(payload) }),
  clearNotifications: () => request('/student/notifications/clear', { method: 'POST' }),

  // Subjects
  getSubjects: () => request('/subjects'),
  createSubject: (payload) => request('/subjects', { method: 'POST', body: JSON.stringify(payload) }),
  getSubjectById: (id) => request(`/subjects/${id}`),
  updateSubject: (id, payload) => request(`/subjects/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteSubject: (id) => request(`/subjects/${id}`, { method: 'DELETE' }),
  addTopicToSubject: (subjectId, payload) => request(`/subjects/${subjectId}/topics`, { method: 'POST', body: JSON.stringify(payload) }),
  deleteTopic: (subjectId, topicId) => request(`/subjects/${subjectId}/topics/${topicId}`, { method: 'DELETE' }),

  // Syllabus
  uploadSyllabusText: (payload) => request('/syllabus/upload', { method: 'POST', body: JSON.stringify(payload) }),
  uploadSyllabusFile: async (formData) => {
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/syllabus/upload`, {
      method: 'POST',
      headers,
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Upload failed');
    return data;
  },
  saveParsedSyllabus: (payload) => request('/syllabus/save', { method: 'POST', body: JSON.stringify(payload) }),

  // Planner
  generatePlan: () => request('/planner/generate', { method: 'POST' }),
  getTodayPlan: () => request('/planner/today'),
  getUpcomingPlan: () => request('/planner/upcoming'),
  completeTask: (taskId) => request(`/planner/tasks/${taskId}/complete`, { method: 'POST' }),
  skipTask: (taskId) => request(`/planner/tasks/${taskId}/skip`, { method: 'POST' }),

  // Revision
  getRevisions: () => request('/revisions'),
  completeRevision: (id, payload) => request(`/revisions/${id}/complete`, { method: 'POST', body: JSON.stringify(payload) }),

  // Quiz
  generateQuiz: (payload) => request('/quiz/generate', { method: 'POST', body: JSON.stringify(payload) }),
  submitQuiz: (quizId, payload) => request(`/quiz/${quizId}/submit`, { method: 'POST', body: JSON.stringify(payload) }),
  getRecentAttempts: () => request('/quiz/attempts'),

  // Performance
  getPerformanceSummary: () => request('/performance/summary'),
  addPerformanceRecord: (payload) => request('/performance/record', { method: 'POST', body: JSON.stringify(payload) }),

  // Academic Standing & Previous Marks (Gemini AI Powered)
  getAcademicData: () => request('/academic-marks/data'),
  saveAcademicProfile: (payload) => request('/academic-marks/profile', { method: 'POST', body: JSON.stringify(payload) }),
  addPreviousMark: (payload) => request('/academic-marks/record', { method: 'POST', body: JSON.stringify(payload) }),
  deletePreviousMark: (id) => request(`/academic-marks/record/${id}`, { method: 'DELETE' }),
  analyzeAcademicAndMarks: () => request('/academic-marks/analyze', { method: 'POST' }),

  // AI Assistant
  chatWithCoach: (message, history = []) => request('/ai/chat', { method: 'POST', body: JSON.stringify({ message, history }) }),
  askAICoach: (payload) => {
    const msg = typeof payload === 'string' ? payload : (payload.query || payload.message);
    const hist = (payload && payload.history) || [];
    return request('/ai/chat', { method: 'POST', body: JSON.stringify({ message: msg, history: hist }) });
  },
  getDailyRecommendation: () => request('/ai/recommendation'),
  getDualEngineStatus: () => request('/ai/dual-engine-status'),
  testDualEngineKeys: (payload) => request('/ai/test-keys', { method: 'POST', body: JSON.stringify(payload) }),
  updateDualEngineKeys: (payload) => request('/ai/update-keys', { method: 'POST', body: JSON.stringify(payload) }),
  getTriEngineStatus: () => request('/ai/dual-engine-status'),
  testTriEngineKeys: (payload) => request('/ai/test-keys', { method: 'POST', body: JSON.stringify(payload) }),
  updateTriEngineKeys: (payload) => request('/ai/update-keys', { method: 'POST', body: JSON.stringify(payload) }),

  // 1-Click Hackathon Demo
  loadDemo: () => request('/demo/load', { method: 'POST' })
};
