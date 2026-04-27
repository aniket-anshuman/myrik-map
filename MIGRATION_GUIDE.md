# Migration Guide: localStorage → MongoDB

Complete step-by-step guide to migrate from localStorage to MongoDB backend.

---

## Overview

### Current Architecture (Phase 1)
```
Browser (HTML/JS) → localStorage → Browser
```

### Target Architecture (Phase 2)
```
Browser (HTML/JS) → REST API → Express → MongoDB
```

---

## Prerequisites

- Node.js 18+ installed
- MongoDB installed locally or Atlas account
- Visual Studio Code or similar editor

---

## Step 1: Setup Backend

### 1.1 Install Dependencies

```bash
cd d:\Repos\Personal\MyrIK
npm install
```

### 1.2 Create Upload Directory

```bash
mkdir -p uploads/issues
```

### 1.3 Setup Environment File

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/issues-db
DB_NAME=issues-db
```

### 1.4 Test Backend Server

```bash
npm start
```

Should see:
```
Server running on port 3000
Available Endpoints:
  POST   /api/issues
  GET    /api/issues
  ...
```

---

## Step 2: Create API Service Class

Create `d:\Repos\Personal\MyrIK\apiClient.js`:

```javascript
// API Client for Issue Reporting System
class IssueAPIClient {
  constructor(baseURL = 'http://localhost:3000') {
    this.baseURL = baseURL;
  }

  // Create issue with image
  async createIssue(formData) {
    try {
      const response = await fetch(`${this.baseURL}/api/issues`, {
        method: 'POST',
        body: formData // multipart/form-data
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create issue');
      }

      return await response.json();
    } catch (error) {
      console.error('Create issue error:', error);
      throw error;
    }
  }

  // Get all issues
  async getIssues(filters = {}) {
    try {
      const params = new URLSearchParams(filters);
      const response = await fetch(
        `${this.baseURL}/api/issues?${params}`,
        { method: 'GET' }
      );

      if (!response.ok) throw new Error('Failed to fetch issues');

      return await response.json();
    } catch (error) {
      console.error('Get issues error:', error);
      throw error;
    }
  }

  // Get single issue
  async getIssue(id) {
    try {
      const response = await fetch(`${this.baseURL}/api/issues/${id}`, {
        method: 'GET'
      });

      if (!response.ok) throw new Error('Failed to fetch issue');

      return await response.json();
    } catch (error) {
      console.error('Get issue error:', error);
      throw error;
    }
  }

  // Get statistics
  async getStatistics() {
    try {
      const response = await fetch(`${this.baseURL}/api/issues-stats`, {
        method: 'GET'
      });

      if (!response.ok) throw new Error('Failed to fetch statistics');

      return await response.json();
    } catch (error) {
      console.error('Get statistics error:', error);
      throw error;
    }
  }

  // Get count by category
  async getCountByCategory(category) {
    try {
      const response = await fetch(
        `${this.baseURL}/api/issues-count/category/${encodeURIComponent(category)}`,
        { method: 'GET' }
      );

      if (!response.ok) throw new Error('Failed to fetch count');

      return await response.json();
    } catch (error) {
      console.error('Get count error:', error);
      throw error;
    }
  }

  // Delete issue
  async deleteIssue(id) {
    try {
      const response = await fetch(`${this.baseURL}/api/issues/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete issue');

      return await response.json();
    } catch (error) {
      console.error('Delete issue error:', error);
      throw error;
    }
  }

  // Update issue status
  async updateIssueStatus(id, status) {
    try {
      const response = await fetch(`${this.baseURL}/api/issues/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (!response.ok) throw new Error('Failed to update issue');

      return await response.json();
    } catch (error) {
      console.error('Update issue error:', error);
      throw error;
    }
  }
}
```

Add to `index.html` before `app.js`:

```html
<script src="apiClient.js"></script>
<script src="app.js"></script>
```

---

## Step 3: Modify app.js for API Integration

### 3.1 Update Constructor

```javascript
class IssueReportingApp {
  constructor() {
    this.issues = [];
    this.filteredIssues = [];
    this.currentImageFile = null;
    this.categories = [...]; // keep existing
    
    // Add API client
    this.api = new IssueAPIClient('http://localhost:3000');
    this.useAPI = true; // Switch between localStorage and API
    
    this.init();
  }
}
```

### 3.2 Update Form Submission

Replace the `handleFormSubmit` method:

```javascript
async handleFormSubmit(e) {
  e.preventDefault();

  const formData = new FormData(document.getElementById('issueForm'));

  // Validate image
  if (!this.currentImageFile) {
    this.showAlert('Please select an image', 'danger');
    return;
  }

  try {
    // Send to API instead of storing locally
    if (this.useAPI) {
      // Append image file directly
      const imageFile = document.getElementById('imageInput').files[0];
      formData.set('image', imageFile);

      const response = await this.api.createIssue(formData);

      if (response.success) {
        this.resetForm();
        await this.loadIssues(); // Refresh from server
        this.updateStatistics();
        this.showAlert('Issue reported successfully!', 'success');
      }
    } else {
      // Fallback to localStorage for offline mode
      const issue = {
        id: this.generateId(),
        issue: formData.get('issue'),
        category: formData.get('category'),
        latitude: parseFloat(formData.get('latitude')),
        longitude: parseFloat(formData.get('longitude')),
        imageData: this.currentImageFile,
        createdAt: new Date().toISOString(),
        status: 'open'
      };

      this.issues.unshift(issue);
      this.saveIssuesToStorage();
      this.resetForm();
      this.renderIssues();
      this.showAlert('Issue saved locally (offline mode)', 'success');
    }
  } catch (error) {
    this.showAlert(`Error: ${error.message}`, 'danger');
  }
}
```

### 3.3 Update Load Issues

```javascript
async loadIssues() {
  try {
    if (this.useAPI) {
      const response = await this.api.getIssues();
      this.issues = response.data || [];
    } else {
      this.loadIssuesFromStorage();
    }
  } catch (error) {
    console.warn('Failed to load from API, using localStorage');
    this.useAPI = false;
    this.loadIssuesFromStorage();
  }
}

// Call in init()
async init() {
  await this.loadIssues(); // Changed from sync to async
  this.setupEventListeners();
  this.renderIssues();
  this.updateStatistics();
  this.populateCategoryFilter();
}
```

### 3.4 Update Delete Issue

```javascript
async deleteIssue(id) {
  if (!confirm('Are you sure you want to delete this issue?')) return;

  try {
    if (this.useAPI) {
      await this.api.deleteIssue(id);
      await this.loadIssues();
    } else {
      this.issues = this.issues.filter(i => i.id !== id);
      this.saveIssuesToStorage();
    }

    this.renderIssues();
    this.updateStatistics();
    this.showAlert('Issue deleted successfully', 'success');
  } catch (error) {
    this.showAlert(`Error: ${error.message}`, 'danger');
  }
}
```

### 3.5 Update Status Update

```javascript
async updateIssueStatus(id, status) {
  try {
    if (this.useAPI) {
      await this.api.updateIssueStatus(id, status);
      await this.loadIssues();
    } else {
      const issue = this.issues.find(i => i.id === id);
      if (issue) issue.status = status;
      this.saveIssuesToStorage();
    }

    this.renderIssues();
    this.updateStatistics();
    this.showAlert(`Issue marked as ${status}`, 'success');
  } catch (error) {
    this.showAlert(`Error: ${error.message}`, 'danger');
  }
}
```

### 3.6 Update Statistics

```javascript
async updateStatistics() {
  try {
    if (this.useAPI) {
      const stats = await this.api.getStatistics();
      document.getElementById('totalCount').textContent = 
        stats.data?.totalIssues || 0;
      
      const openCount = this.issues.filter(i => i.status === 'open').length;
      document.getElementById('openCount').textContent = openCount;
    } else {
      // Fallback to local calculation
      document.getElementById('totalCount').textContent = this.issues.length;
      const openCount = this.issues.filter(i => i.status === 'open').length;
      document.getElementById('openCount').textContent = openCount;
    }

    this.updateCategoryStats();
  } catch (error) {
    console.error('Error updating statistics:', error);
  }
}
```

---

## Step 4: Setup MongoDB Database

### Option A: Local MongoDB

```bash
# Start MongoDB service
mongod

# In another terminal, connect
mongosh

# Create database
use issues-db

# Create indexes
db.issues.createIndex({ "category": 1 })
db.issues.createIndex({ "status": 1 })
db.issues.createIndex({ "createdAt": -1 })
db.issues.createIndex({ location: "2dsphere" })
```

### Option B: MongoDB Atlas (Cloud)

1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create cluster
4. Get connection string
5. Update `.env`:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/issues-db
```

---

## Step 5: Update Backend for Image Storage

### Option A: Continue Using Base64 (Simple)

The current implementation works as-is! Images are stored as base64 in MongoDB.

### Option B: Use S3 or Cloud Storage (Recommended for Production)

Install AWS SDK:

```bash
npm install aws-sdk
```

Update `issueService.js`:

```javascript
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

async uploadImageToS3(file) {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `issues/${Date.now()}-${file.originalname}`,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'public-read'
  };

  const result = await s3.upload(params).promise();
  return result.Location; // Return S3 URL
}
```

---

## Step 6: Testing the Migration

### 6.1 Test with Sample Data

```javascript
// In browser console
const client = new IssueAPIClient();

// Create test issue
const formData = new FormData();
formData.append('issue', 'Test issue');
formData.append('category', 'Road Damage');
formData.append('latitude', '40.7128');
formData.append('longitude', '-74.0060');

// You need an actual file for this
const fileInput = document.getElementById('imageInput');
formData.append('image', fileInput.files[0]);

client.createIssue(formData).then(r => console.log(r));
```

### 6.2 Verify Database

```bash
# Connect to MongoDB
mongosh

# Check data
use issues-db
db.issues.find().pretty()

# Check count
db.issues.countDocuments()
```

---

## Step 7: Hybrid Mode (Fallback)

Implement graceful fallback:

```javascript
// In app.js init()
async init() {
  try {
    await this.loadIssues(); // Try API first
    this.useAPI = true;
  } catch (error) {
    console.warn('API unavailable, using localStorage');
    this.useAPI = false;
    this.loadIssuesFromStorage();
  }

  // ... rest of init
}
```

Show status to user:

```html
<!-- Add to header -->
<div id="connectionStatus" style="position: fixed; top: 20px; right: 20px; 
     padding: 10px 15px; border-radius: 5px; font-weight: 600;">
</div>
```

```javascript
updateConnectionStatus() {
  const status = document.getElementById('connectionStatus');
  if (this.useAPI) {
    status.innerHTML = '🟢 Connected';
    status.style.background = '#d4edda';
    status.style.color = '#155724';
  } else {
    status.innerHTML = '🔴 Offline (Local)';
    status.style.background = '#f8d7da';
    status.style.color = '#721c24';
  }
}

// Call in init()
this.updateConnectionStatus();
```

---

## Step 8: Data Migration Script

Migrate existing localStorage data to MongoDB:

```javascript
// migrate.js - Run this once to transfer data
const IssueAPIClient = require('./apiClient.js');
const fs = require('fs');

async function migrateData() {
  const client = new IssueAPIClient('http://localhost:3000');
  
  // Exported issues JSON from browser
  const issues = JSON.parse(fs.readFileSync('exported-issues.json', 'utf8'));

  for (const issue of issues) {
    try {
      await client.createIssue({
        issue: issue.issue,
        category: issue.category,
        latitude: issue.latitude,
        longitude: issue.longitude,
        image: issue.imageData // base64
      });
      console.log(`Migrated: ${issue.id}`);
    } catch (error) {
      console.error(`Failed: ${issue.id}`, error.message);
    }
  }

  console.log('Migration complete!');
}

migrateData();
```

Run:

```bash
# Export from browser first
# Open browser console, run:
// Copy output
JSON.stringify(JSON.parse(localStorage.getItem('issues')), null, 2)
// Save as exported-issues.json

# Then run migration
node migrate.js
```

---

## Step 9: Rollout Strategy

### Phase 1: Development
- ✅ Backend running locally
- ✅ API tested
- ✅ Frontend connected to API
- ✅ Data migration tested

### Phase 2: Testing
- Test all CRUD operations
- Test error handling
- Test with multiple users
- Monitor performance

### Phase 3: Production
- Deploy backend to server
- Update API URL in frontend
- Monitor error logs
- Keep localStorage fallback enabled

---

## Troubleshooting Migration

### Issue: CORS Error

Add to backend `app.js`:

```javascript
const cors = require('cors');
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:8000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
```

### Issue: Images not displaying

If using S3 URLs, verify:
- S3 bucket is public
- URLs are correct
- CORS configured on bucket

### Issue: Data not syncing

Check:
- API server is running
- MongoDB is connected
- Network tab in DevTools
- Browser console errors

### Issue: Performance degradation

```javascript
// Add pagination
const response = await this.api.getIssues({
  page: 1,
  limit: 20
});
```

---

## Complete Migration Checklist

- [ ] Backend installed and tested
- [ ] MongoDB setup and verified
- [ ] API endpoints tested with Postman/cURL
- [ ] `apiClient.js` created
- [ ] `app.js` updated with API calls
- [ ] Hybrid localStorage/API mode working
- [ ] Test data migrated
- [ ] Error handling implemented
- [ ] Connection status indicator added
- [ ] Documentation updated
- [ ] Team trained on new system
- [ ] Deployed to production
- [ ] Monitoring in place

---

## Rollback Plan

If issues occur:

```javascript
// In app.js, set to use localStorage
this.useAPI = false;
this.loadIssuesFromStorage();
```

All data is preserved in both localStorage and MongoDB during transition!

---

## Next Steps

1. Complete the migration
2. Add user authentication
3. Implement real-time updates (WebSockets)
4. Add admin dashboard
5. Deploy to production
6. Setup monitoring and logging

---

## Support

Refer to:
- `API_DOCUMENTATION.md` - API reference
- `ARCHITECTURE.md` - System design
- `TESTING_GUIDE.md` - Testing procedures

Good luck with your migration! 🚀
