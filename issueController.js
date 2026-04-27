const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/issues/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// POST - Create new issue with image
router.post('/api/issues', upload.single('image'), async (req, res) => {
  try {
    const { issue, category, latitude, longitude } = req.body;

    // Validation
    if (!issue || !category || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: issue, category, latitude, longitude'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Image file is required'
      });
    }

    // Validate coordinates
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({
        success: false,
        message: 'Invalid latitude or longitude'
      });
    }

    // Create issue object (in production, save to database)
    const newIssue = {
      id: generateId(),
      issue: issue,
      category: category,
      latitude: lat,
      longitude: lng,
      imageUrl: `/uploads/issues/${req.file.filename}`,
      imageOriginalName: req.file.originalname,
      createdAt: new Date(),
      status: 'open'
    };

    // TODO: Save to database
    // await IssueService.createIssue(newIssue);

    res.status(201).json({
      success: true,
      message: 'Issue created successfully',
      data: newIssue
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating issue',
      error: error.message
    });
  }
});

// GET - Retrieve all issues with optional filters
router.get('/api/issues', async (req, res) => {
  try {
    const { category, latitude, longitude, radius } = req.query;
    const filters = {};

    if (category) {
      filters.category = category;
    }

    // Geolocation filter (radius in km)
    if (latitude && longitude && radius) {
      filters.location = {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        radius: parseFloat(radius)
      };
    }

    // TODO: Fetch from database with filters
    // const issues = await IssueService.getIssues(filters);

    // Mock data for demonstration
    const issues = [
      {
        id: '1',
        issue: 'Pothole on Main Street',
        category: 'Road Damage',
        latitude: 40.7128,
        longitude: -74.0060,
        imageUrl: '/uploads/issues/image1.jpg',
        createdAt: new Date(),
        status: 'open'
      }
    ];

    res.status(200).json({
      success: true,
      count: issues.length,
      data: issues
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving issues',
      error: error.message
    });
  }
});

// GET - Retrieve specific issue by ID
router.get('/api/issues/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // TODO: Fetch from database
    // const issue = await IssueService.getIssueById(id);

    // Mock data
    const issue = {
      id: id,
      issue: 'Pothole on Main Street',
      category: 'Road Damage',
      latitude: 40.7128,
      longitude: -74.0060,
      imageUrl: '/uploads/issues/image1.jpg',
      createdAt: new Date(),
      status: 'open'
    };

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }

    res.status(200).json({
      success: true,
      data: issue
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving issue',
      error: error.message
    });
  }
});

// GET - Get total count of issues
router.get('/api/issues-count/total', async (req, res) => {
  try {
    // TODO: Get count from database
    // const count = await IssueService.getTotalCount();

    const count = 42; // Mock data

    res.status(200).json({
      success: true,
      count: count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting issue count',
      error: error.message
    });
  }
});

// GET - Get count of issues by category
router.get('/api/issues-count/category/:category', async (req, res) => {
  try {
    const { category } = req.params;

    // TODO: Get count from database
    // const count = await IssueService.getCountByCategory(category);

    const count = 15; // Mock data

    res.status(200).json({
      success: true,
      category: category,
      count: count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting category count',
      error: error.message
    });
  }
});

// GET - Get count of issues by status
router.get('/api/issues-count/status/:status', async (req, res) => {
  try {
    const { status } = req.params;

    // TODO: Get count from database
    // const count = await IssueService.getCountByStatus(status);

    const count = 10; // Mock data

    res.status(200).json({
      success: true,
      status: status,
      count: count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting status count',
      error: error.message
    });
  }
});

// GET - Get statistics (all counts)
router.get('/api/issues-stats', async (req, res) => {
  try {
    // TODO: Get all statistics from database
    // const stats = await IssueService.getStatistics();

    const stats = {
      totalIssues: 42,
      categories: {
        'Road Damage': 15,
        'Pothole': 12,
        'Street Light': 8,
        'Other': 7
      },
      byStatus: {
        'open': 25,
        'in-progress': 10,
        'resolved': 7
      }
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting statistics',
      error: error.message
    });
  }
});

// Helper function to generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

module.exports = router;
