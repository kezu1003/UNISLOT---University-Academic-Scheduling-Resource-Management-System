const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging in development
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// ==================== ROUTES ====================
console.log('Registering routes...');

// Auth Routes
app.use('/api/auth', require('./routes/auth'));
console.log('✅ Auth routes registered');

// Admin Routes
app.use('/api/admin', require('./routes/admin'));
console.log('✅ Admin routes registered');

// LIC Routes
app.use('/api/lic', require('./routes/lic'));
console.log('✅ LIC routes registered');

// Coordinator Routes
app.use('/api/coordinator', require('./routes/coordinator'));
console.log('✅ Coordinator routes registered');

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'UniSlot API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Test route
app.get('/api/test', async (req, res) => {
  try {
    const Staff = require('./models/Staff');
    const Batch = require('./models/Batch');
    const Course = require('./models/Course');
    const Hall = require('./models/Hall');
    const Timetable = require('./models/Timetable');
    
    const counts = {
      staff: await Staff.countDocuments(),
      batches: await Batch.countDocuments(),
      courses: await Course.countDocuments(),
      halls: await Hall.countDocuments(),
      timetable: await Timetable.countDocuments()
    };
    
    res.json({
      success: true,
      message: 'Database connection working',
      counts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: '🎓 UniSlot API Server',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      test: '/api/test',
      auth: '/api/auth',
      admin: '/api/admin',
      lic: '/api/lic',
      coordinator: '/api/coordinator'
    }
  });
});

// 404 handler - MUST be after all routes
app.use((req, res) => {
  console.log('❌ Route not found:', req.method, req.path);
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
    availableRoutes: [
      '/api/health',
      '/api/test',
      '/api/auth',
      '/api/admin',
      '/api/lic',
      '/api/coordinator'
    ]
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║     🎓  UniSlot API Server                           ║
║     📡  Running on port ${PORT}                          ║
║     🌍  Environment: ${process.env.NODE_ENV || 'development'}                    ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err.message);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Process terminated');
  });
});