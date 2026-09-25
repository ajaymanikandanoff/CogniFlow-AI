const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const { connectDB } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const syllabusRoutes = require('./routes/syllabusRoutes');
const plannerRoutes = require('./routes/plannerRoutes');
const revisionRoutes = require('./routes/revisionRoutes');
const quizRoutes = require('./routes/quizRoutes');
const performanceRoutes = require('./routes/performanceRoutes');
const academicMarksRoutes = require('./routes/academicMarksRoutes');
const aiRoutes = require('./routes/aiRoutes');
const demoRoutes = require('./routes/demoRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    product: 'AI Personalized Learning & Revision Coach',
    timestamp: new Date().toISOString()
  });
});

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/syllabus', syllabusRoutes);
app.use('/api/planner', plannerRoutes);
app.use('/api/revisions', revisionRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/academic-marks', academicMarksRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/demo', demoRoutes);

// Static Client Serving (Single Full-Stack Server)
const clientDist = path.join(__dirname, '../../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Error Handling
app.use(errorHandler);

// Start Server
async function startServer() {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(` AI PERSONALIZED LEARNING & REVISION COACH `);
    console.log(` Server running on http://localhost:${PORT} `);
    console.log(` Client available on http://localhost:${PORT} `);
    console.log(` Mode: ${process.env.NODE_ENV || 'production/dev'} `);
    console.log(`=======================================================`);
  });
}

startServer();
