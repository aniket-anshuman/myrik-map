// ============================================================
// Seed Script - Populate database with test data
// ============================================================

const Database = require('./database');
const fs = require('fs');
const path = require('path');

const db = new Database('./issues.db');

// Sample image (small placeholder GIF as base64)
const sampleImage = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

const testIssues = [
  {
    id: 'issue-001',
    issue: 'Pothole on NH-48 near Gurugram',
    category: 'Pothole',
    latitude: 28.4089,
    longitude: 77.0066,
    status: 'open',
    imageData: sampleImage,
    imageName: 'pothole-1.jpg',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
  },
  {
    id: 'issue-002',
    issue: 'Street light not working in Mumbai Central constituency',
    category: 'Street Light',
    latitude: 19.0176,
    longitude: 72.8479,
    status: 'in-progress',
    imageData: sampleImage,
    imageName: 'light-1.jpg',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
  },
  {
    id: 'issue-003',
    issue: 'Road damage on Grand Trunk Road - Delhi North',
    category: 'Road Damage',
    latitude: 28.7465,
    longitude: 77.1113,
    status: 'open',
    imageData: sampleImage,
    imageName: 'road-1.jpg',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
  },
  {
    id: 'issue-004',
    issue: 'Broken sidewalk in Bangalore South',
    category: 'Sidewalk Issue',
    latitude: 12.9716,
    longitude: 77.5946,
    status: 'resolved',
    imageData: sampleImage,
    imageName: 'sidewalk-1.jpg',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() // 10 days ago
  },
  {
    id: 'issue-005',
    issue: 'Drainage blockage in Kolkata South West',
    category: 'Drainage Issue',
    latitude: 22.5726,
    longitude: 88.3639,
    status: 'open',
    imageData: sampleImage,
    imageName: 'drainage-1.jpg',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago
  },
  {
    id: 'issue-006',
    issue: 'Traffic sign damaged - Chennai Central',
    category: 'Traffic Sign',
    latitude: 13.0499,
    longitude: 80.2624,
    status: 'open',
    imageData: sampleImage,
    imageName: 'sign-1.jpg',
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() // 6 hours ago
  },
  {
    id: 'issue-007',
    issue: 'Tree overgrowth blocking path - Hyderabad East',
    category: 'Vegetation Issue',
    latitude: 17.3667,
    longitude: 78.5243,
    status: 'in-progress',
    imageData: sampleImage,
    imageName: 'veg-1.jpg',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() // 4 days ago
  },
  {
    id: 'issue-008',
    issue: 'Pothole on MG Road - Pune',
    category: 'Pothole',
    latitude: 18.5204,
    longitude: 73.8567,
    status: 'open',
    imageData: sampleImage,
    imageName: 'pothole-2.jpg',
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() // 12 hours ago
  }
];

async function seed() {
  try {
    console.log('🌱 Starting database seed...\n');

    await db.initialize();
    console.log('✅ Database initialized');

    // Clear existing data
    await db.clearAll();
    console.log('✅ Cleared existing data');

    // Insert test issues
    for (const issue of testIssues) {
      await db.addIssue(issue);
      console.log(`✅ Created issue: ${issue.issue}`);
    }

    console.log(`\n✨ Seeded ${testIssues.length} test issues`);
    console.log('🗺️  Issues are now visible on the map!');

    await db.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
