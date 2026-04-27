// ============================================================
// Express Server for Issue Reporting System
// ============================================================

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const Database = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;
const API_BASE_URL = process.env.API_BASE_URL || `http://localhost:${PORT}/api`;

const dbPath = process.env.VERCEL ? '/tmp/issues.db' : (process.env.DB_PATH || './issues.db');
const db = new Database(dbPath);

// ============================================================
// Middleware
// ============================================================

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Middleware to set correct MIME types before serving static files
app.use((req, res, next) => {
  if (req.path.endsWith('.js')) {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  } else if (req.path.endsWith('.json')) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
  } else if (req.path.endsWith('.css')) {
    res.setHeader('Content-Type', 'text/css; charset=utf-8');
  } else if (req.path.endsWith('.html')) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
  }
  next();
});

// Serve static files (HTML, CSS, JS, images, GeoJSON) - use __dirname for serverless
app.use(express.static(__dirname));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// ============================================================
// Root Route - Serve HTML
// ============================================================

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index-tabbed.html'));
});

app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'index-tabbed.html'));
});

// ============================================================
// Health Check & Config
// ============================================================

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Config endpoint - returns API configuration
app.get('/api/config', (req, res) => {
  res.json({
    apiBaseUrl: API_BASE_URL,
    port: PORT,
    env: process.env.NODE_ENV || 'development'
  });
});

// ============================================================
// Issue Endpoints
// ============================================================

// GET all issues (with optional bounding box filtering)
app.get('/api/issues', async (req, res) => {
  try {
    const status = req.query.status;
    const category = req.query.category;
    const minLat = req.query.minLat;
    const maxLat = req.query.maxLat;
    const minLng = req.query.minLng;
    const maxLng = req.query.maxLng;

    let issues;

    // If bounding box parameters are provided, use them for efficient spatial filtering
    if (minLat !== undefined && maxLat !== undefined && minLng !== undefined && maxLng !== undefined) {
      const min = parseFloat(minLat);
      const max = parseFloat(maxLat);
      const minL = parseFloat(minLng);
      const maxL = parseFloat(maxLng);

      console.log(`🗺️ Fetching issues in bounding box: lat[${min}, ${max}], lng[${minL}, ${maxL}]`);
      issues = await db.getIssuesByBoundingBox(min, max, minL, maxL);
    } else if (status) {
      issues = await db.getIssuesByStatus(status);
    } else if (category) {
      issues = await db.getIssuesByCategory(category);
    } else {
      issues = await db.getAllIssues();
    }

    res.json({
      success: true,
      data: issues,
      count: issues.length
    });
  } catch (error) {
    console.error('Error fetching issues:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching issues',
      error: error.message
    });
  }
});

// GET single issue
app.get('/api/issues/:id', async (req, res) => {
  try {
    const issue = await db.getIssue(req.params.id);

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }

    // Get comments for this issue
    const comments = await db.getComments(req.params.id);
    issue.comments = comments;

    res.json({
      success: true,
      data: issue
    });
  } catch (error) {
    console.error('Error fetching issue:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching issue',
      error: error.message
    });
  }
});

// POST create issue
app.post('/api/issues', async (req, res) => {
  try {
    const { issue, category, latitude, longitude, constituency, state, imageData, imageName } =
      req.body;

    // Validation
    if (!issue || !category || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    console.log(`📝 Creating issue: "${issue}" in ${constituency || 'Unknown'}`);

    const issueId =
      Date.now().toString(36) + Math.random().toString(36).substr(2);
    const newIssue = {
      id: issueId,
      issue: issue,
      category: category,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      constituency: constituency || null,
      state: state || null,
      status: 'open',
      imageData: imageData || null,
      imageName: imageName || 'image',
      createdAt: new Date().toISOString()
    };

    console.log(`✅ Issue object ready: ${JSON.stringify(newIssue).substring(0, 100)}...`);
    const saved = await db.addIssue(newIssue);
    console.log(`✅ Issue saved with ID: ${saved.id}`);

    res.status(201).json({
      success: true,
      message: 'Issue created successfully',
      data: saved
    });
  } catch (error) {
    console.error('Error creating issue:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating issue',
      error: error.message
    });
  }
});

// PUT update issue
app.put('/api/issues/:id', async (req, res) => {
  try {
    const { status, issue, category } = req.body;
    const updated = await db.updateIssue(req.params.id, {
      status,
      issue,
      category
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }

    const updatedIssue = await db.getIssue(req.params.id);
    res.json({
      success: true,
      message: 'Issue updated successfully',
      data: updatedIssue
    });
  } catch (error) {
    console.error('Error updating issue:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating issue',
      error: error.message
    });
  }
});

// DELETE issue
app.delete('/api/issues/:id', async (req, res) => {
  try {
    const deleted = await db.deleteIssue(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }

    res.json({
      success: true,
      message: 'Issue deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting issue:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting issue',
      error: error.message
    });
  }
});

// ============================================================
// Statistics Endpoints
// ============================================================

app.get('/api/statistics', async (req, res) => {
  try {
    const stats = await db.getStatistics();
    const categoryStats = await db.getCategoryStats();

    res.json({
      success: true,
      data: {
        ...stats,
        categories: categoryStats
      }
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
});

// ============================================================
// Search Endpoints
// ============================================================

app.get('/api/search', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query required'
      });
    }

    const results = await db.searchIssues(q);

    res.json({
      success: true,
      data: results,
      count: results.length
    });
  } catch (error) {
    console.error('Error searching:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching',
      error: error.message
    });
  }
});

// ============================================================
// Constituency Endpoints
// ============================================================

app.get('/api/constituencies/:name/issues', async (req, res) => {
  try {
    const constituencyName = decodeURIComponent(req.params.name);
    const issues = await db.getAllIssues();

    // Filter issues by constituency
    const filteredIssues = issues.filter(issue =>
      issue.constituency === constituencyName
    );

    res.json({
      success: true,
      data: filteredIssues,
      count: filteredIssues.length
    });
  } catch (error) {
    console.error('Error fetching constituency issues:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching constituency issues',
      error: error.message
    });
  }
});

// ============================================================
// Comments Endpoints
// ============================================================

app.post('/api/issues/:id/comments', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Comment text required'
      });
    }

    const comment = await db.addComment(req.params.id, text);

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: comment
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding comment',
      error: error.message
    });
  }
});

app.get('/api/issues/:id/comments', async (req, res) => {
  try {
    const comments = await db.getComments(req.params.id);

    res.json({
      success: true,
      data: comments,
      count: comments.length
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching comments',
      error: error.message
    });
  }
});

// ============================================================
// Error Handling
// ============================================================

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message
  });
});

// ============================================================
// Server Initialization
// ============================================================

// Initialize database once on startup
let dbInitialized = false;
let dbInitPromise = db.initialize().then(() => {
  dbInitialized = true;
  console.log('Database initialized');
}).catch(err => {
  console.error('Failed to initialize database:', err);
});

// Middleware to ensure DB is initialized before handling requests
app.use(async (req, res, next) => {
  if (!dbInitialized) {
    try {
      await dbInitPromise;
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: 'Database initialization failed',
        error: err.message
      });
    }
  }
  next();
});

// Start function for local development
async function start() {
  try {
    await dbInitPromise;
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await db.close();
  process.exit(0);
});

// Only start server in local environment (not on Vercel)
if (require.main === module && !process.env.VERCEL) {
  start();
}

// Export app for Vercel serverless functions
module.exports = app;
