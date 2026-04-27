# Complete Service Setup - Backend API + Frontend UI

## Quick Start (TL;DR)

```bash
# 1. Install dependencies
npm install

# 2. Create upload directory
mkdir -p uploads/issues

# 3. Start the server
npm start

# 4. Open browser
http://localhost:3000
```

Done! Service is running on port 3000 with both API and UI.

---

## Detailed Setup

### Prerequisites

Ensure you have:
- **Node.js 18+** installed ([download](https://nodejs.org/))
- **npm** (comes with Node.js)
- Terminal/Command Prompt access

Check versions:
```bash
node --version    # Should be v18+ 
npm --version     # Should be v8+
```

---

## Step-by-Step Installation

### Step 1: Navigate to Project Directory

```bash
cd d:\Repos\Personal\MyrIK
```

Or if using PowerShell:
```powershell
cd d:\Repos\Personal\MyrIK
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs:
- **express** - Web framework
- **multer** - File upload handling
- **cors** - Cross-Origin requests
- **dotenv** - Environment variables

Expected output:
```
npm notice
npm notice New minor version of npm available: x.x.x → x.x.x
npm notice Run `npm install -g npm@x.x.x` to update it
added XX packages, and audited XX packages in Xs
```

### Step 3: Create Upload Directory

```bash
# Windows (Command Prompt)
mkdir uploads\issues

# Windows (PowerShell)
mkdir -p uploads/issues

# Mac/Linux
mkdir -p uploads/issues
```

### Step 4: Setup Environment File (Optional)

```bash
# Copy template
cp .env.example .env

# Edit .env with your settings
# (Or just use defaults - works fine)
```

Default `.env` settings (already in .env.example):
```
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/issues-db
UPLOAD_DIR=./uploads/issues
MAX_FILE_SIZE=5242880
```

---

## Running the Service

### Option 1: Normal Mode (Recommended)

```bash
npm start
```

Output should show:
```
Server running on port 3000

Available Endpoints:

  POST   /api/issues                      - Create new issue with image
  GET    /api/issues                      - Get all issues (with filters)
  GET    /api/issues/:id                  - Get issue by ID
  GET    /api/issues-count/total          - Get total issue count
  GET    /api/issues-count/category/:cat  - Get count by category
  GET    /api/issues-count/status/:stat   - Get count by status
  GET    /api/issues-stats                - Get all statistics
```

### Option 2: Development Mode (with auto-reload)

```bash
npm run dev
```

Requires: `npm install -g nodemon` (or `npm install --save-dev nodemon`)

This reloads server when you edit files (useful for development).

---

## Accessing the Service

### Frontend UI

Open browser and go to:

```
http://localhost:3000
```

You should see:
- Header: "🗺️ Issue Reporting System"
- Two tabs: "📝 Report Issue" and "🗺️ Map View"
- Form to submit issues
- Interactive map

### Backend API

Test API endpoints:

```bash
# Health check
curl http://localhost:3000/health

# Get all issues
curl http://localhost:3000/api/issues

# Get statistics
curl http://localhost:3000/api/issues-stats

# Get total count
curl http://localhost:3000/api/issues-count/total
```

Or use **Postman** to test all endpoints.

---

## Complete Service Architecture

```
┌─────────────────────────────────────────────────────────┐
│           Your Browser / Client                          │
│  (Chrome, Firefox, Safari, Edge, etc.)                  │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP Requests
                     ↓
┌─────────────────────────────────────────────────────────┐
│    Express.js Server (localhost:3000)                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Frontend Serving (Static Files)                        │
│  ├─ index-tabbed.html                                   │
│  ├─ app.js                                              │
│  ├─ map-leaflet.js                                      │
│  └─ CSS (inline)                                        │
│                                                          │
│  REST API Routes                                        │
│  ├─ POST   /api/issues        (Create)                  │
│  ├─ GET    /api/issues        (Read All)                │
│  ├─ GET    /api/issues/:id    (Read One)                │
│  ├─ PUT    /api/issues/:id    (Update)                  │
│  ├─ DELETE /api/issues/:id    (Delete)                  │
│  ├─ GET    /api/issues-count  (Counts)                  │
│  └─ GET    /api/issues-stats  (Stats)                   │
│                                                          │
│  File Upload Handling (Multer)                          │
│  └─ uploads/issues/           (Storage)                 │
│                                                          │
└─────────────────────────────────────────────────────────┘
                     ↓ (Future)
┌─────────────────────────────────────────────────────────┐
│    MongoDB Database (Optional)                          │
│    mongodb://localhost:27017/issues-db                  │
└─────────────────────────────────────────────────────────┘
```

---

## How It Works Together

### 1. User Visits UI

```
Browser → GET http://localhost:3000
         → Express sends index-tabbed.html
         → Browser loads HTML + CSS + JS
```

### 2. User Submits Issue

```
Browser (Form)
  ↓ (POST with multipart/form-data)
Express API (/api/issues)
  ↓ (Multer processes file)
uploads/issues/ (image saved)
  ↓ (Mock/localStorage stores data)
Success response to browser
```

### 3. User Views Map

```
Browser (Map tab)
  ↓ (GET http://localhost:3000/api/issues)
Express API (/api/issues)
  ↓ (Returns JSON data)
Browser (Leaflet displays markers)
```

---

## File Serving Explanation

The Express server does **TWO things**:

### 1. Serves Frontend (HTML/CSS/JS)

```javascript
// In app.js
app.use(express.static(path.join(__dirname, 'uploads'))); // Static files
app.get('/', (req, res) => {
  // Serves index-tabbed.html (or whichever HTML file)
});
```

**Your browser requests:**
```
GET http://localhost:3000/                    → index-tabbed.html
GET http://localhost:3000/app.js              → app.js
GET http://localhost:3000/map-leaflet.js      → map-leaflet.js
GET http://localhost:3000/uploads/issues/...  → Images
```

### 2. Provides REST API

```javascript
// In issueController.js
router.post('/api/issues', ...)      // Create issue
router.get('/api/issues', ...)       // Get all
router.get('/api/issues/:id', ...)   // Get one
router.delete('/api/issues/:id', ...)// Delete
```

**Your frontend makes requests:**
```
POST http://localhost:3000/api/issues                → Submit form
GET  http://localhost:3000/api/issues                → Load issues
GET  http://localhost:3000/api/issues-count/total    → Get count
```

---

## Data Flow

### Reporting an Issue

```
┌──────────────────────┐
│   User Opens UI      │
│ http://localhost:3000│
└──────────┬───────────┘
           │
           ↓
┌──────────────────────────────────────┐
│ Browser loads:                       │
│ - index-tabbed.html                  │
│ - app.js                             │
│ - map-leaflet.js                     │
│ - Leaflet library (CDN)              │
└──────────┬───────────────────────────┘
           │
           ↓
┌──────────────────────────────────────┐
│ User fills form:                     │
│ - Description                        │
│ - Category                           │
│ - Latitude/Longitude                 │
│ - Image file                         │
└──────────┬───────────────────────────┘
           │
           ↓ (Click Submit)
┌──────────────────────────────────────┐
│ Browser sends POST request:          │
│ POST /api/issues                     │
│ Content-Type: multipart/form-data    │
│ - Fields (description, category...)  │
│ - File (image)                       │
└──────────┬───────────────────────────┘
           │
           ↓
┌──────────────────────────────────────┐
│ Express Server (app.js):             │
│ - Receives POST /api/issues          │
│ - Multer processes file upload       │
│ - Validates data                     │
│ - Saves image to uploads/issues/     │
└──────────┬───────────────────────────┘
           │
           ↓
┌──────────────────────────────────────┐
│ issueController.js:                  │
│ - Validates coordinates              │
│ - Creates issue object               │
│ - Returns 201 Created                │
└──────────┬───────────────────────────┘
           │
           ↓
┌──────────────────────────────────────┐
│ Browser (JavaScript):                │
│ - Receives success response          │
│ - Updates DOM                        │
│ - Shows success message              │
│ - Resets form                        │
│ - Refreshes issue list/map           │
└──────────────────────────────────────┘
```

---

## Commands Reference

### Install & Start

```bash
# Install all dependencies
npm install

# Create upload directory
mkdir -p uploads/issues

# Start server (production)
npm start

# Start server (development with auto-reload)
npm run dev

# Run tests (if available)
npm test
```

### Stop Server

```bash
# Ctrl + C (Windows, Mac, Linux)
```

### Check Port

```bash
# Windows - Check if port 3000 is in use
netstat -ano | findstr :3000

# Mac/Linux - Check if port 3000 is in use
lsof -i :3000

# Kill process on port 3000 (if needed)
# Windows: taskkill /PID <PID> /F
# Mac/Linux: kill -9 <PID>
```

### Clean Up

```bash
# Remove node_modules and reinstall
rm -rf node_modules
npm install

# Clear all uploaded images
rm -rf uploads/issues/*

# Clear browser cache
# Ctrl + Shift + Delete (in most browsers)
```

---

## Testing the API

### Using curl (Command Line)

```bash
# Get all issues
curl http://localhost:3000/api/issues

# Get statistics
curl http://localhost:3000/api/issues-stats

# Get total count
curl http://localhost:3000/api/issues-count/total

# Create issue (requires image file)
curl -X POST http://localhost:3000/api/issues \
  -F "issue=Test pothole" \
  -F "category=Pothole" \
  -F "latitude=40.7128" \
  -F "longitude=-74.0060" \
  -F "image=@C:\path\to\image.jpg"
```

### Using Postman

1. Download [Postman](https://www.postman.com/downloads/)
2. Create new collection "Issue Reporting API"
3. Add requests:
   - **GET** http://localhost:3000/api/issues
   - **POST** http://localhost:3000/api/issues (multipart form)
   - **GET** http://localhost:3000/api/issues-stats

### Using Browser Console

```javascript
// Get all issues
fetch('http://localhost:3000/api/issues')
  .then(r => r.json())
  .then(d => console.log(d));

// Get statistics
fetch('http://localhost:3000/api/issues-stats')
  .then(r => r.json())
  .then(d => console.log(d));
```

---

## Troubleshooting

### "Port 3000 already in use"

```bash
# Find what's using port 3000
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :3000
kill -9 <PID>

# OR use different port
PORT=3001 npm start
```

### "npm command not found"

```bash
# Make sure Node.js is installed
node --version

# If not installed, download from:
# https://nodejs.org/
```

### "Cannot find module 'express'"

```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

### "ENOENT: no such file or directory 'uploads/issues'"

```bash
# Create upload directory
mkdir -p uploads/issues

# Or use npm script
npm run setup  # (if added to package.json)
```

### Server crashes on startup

```bash
# Check app.js for syntax errors
node --check app.js

# Run with verbose logging
NODE_DEBUG=* npm start

# Check browser console for errors (F12)
```

### Images not uploading

1. Check `uploads/issues/` directory exists
2. Verify file size < 5MB
3. Check file format (JPEG, PNG, GIF, WebP)
4. Check browser console for errors
5. Check server logs

### Map not showing

1. Verify Leaflet library loaded (check Network tab in DevTools)
2. Check browser console for errors
3. Ensure map-leaflet.js is in same directory
4. Try different browser

---

## Process Manager Setup (Production)

For running in production, use **PM2**:

```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start app.js --name "issue-reporting-api"

# View running processes
pm2 list

# View logs
pm2 logs issue-reporting-api

# Stop
pm2 stop issue-reporting-api

# Restart
pm2 restart issue-reporting-api

# Auto-restart on server reboot
pm2 startup
pm2 save
```

---

## Docker Setup (Advanced)

To run in Docker:

### Create Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

### Build & Run

```bash
# Build image
docker build -t issue-reporting-api .

# Run container
docker run -p 3000:3000 -v $(pwd)/uploads:/app/uploads issue-reporting-api
```

---

## Development vs Production

### Development (Local)

```bash
npm run dev
```

- Auto-reloads on file changes
- Detailed error messages
- Slower performance
- Good for development

### Production (Server)

```bash
npm start
```

- No auto-reload
- Optimized performance
- Error logging to file
- Better security

---

## Environment Variables

### Available Variables

```bash
# Server
PORT=3000                           # Port to run on
NODE_ENV=development                # Environment mode

# Database (future)
MONGODB_URI=mongodb://localhost:27017/issues-db
DB_NAME=issues-db

# File Upload
UPLOAD_DIR=./uploads/issues         # Where to save images
MAX_FILE_SIZE=5242880               # 5MB in bytes

# API
CORS_ORIGIN=http://localhost:3000   # Allowed origins
```

### Set Variables (Windows Command Prompt)

```bash
set PORT=3001
set NODE_ENV=production
npm start
```

### Set Variables (Windows PowerShell)

```powershell
$env:PORT=3001
$env:NODE_ENV=production
npm start
```

### Set Variables (Mac/Linux)

```bash
export PORT=3001
export NODE_ENV=production
npm start
```

---

## Complete Startup Script

Save as `start.sh` (Mac/Linux) or `start.bat` (Windows):

### start.sh (Mac/Linux)

```bash
#!/bin/bash
echo "Installing dependencies..."
npm install

echo "Creating upload directory..."
mkdir -p uploads/issues

echo "Starting server..."
npm start
```

Run with:
```bash
chmod +x start.sh
./start.sh
```

### start.bat (Windows)

```batch
@echo off
echo Installing dependencies...
call npm install

echo Creating upload directory...
mkdir uploads\issues

echo Starting server...
call npm start

pause
```

Run with:
```bash
start.bat
```

---

## Summary

### Quick Commands

| Task | Command |
|------|---------|
| Install | `npm install` |
| Start | `npm start` |
| Dev mode | `npm run dev` |
| Create uploads | `mkdir -p uploads/issues` |
| Stop | `Ctrl + C` |
| Test API | `curl http://localhost:3000/api/issues` |
| Open UI | `http://localhost:3000` |

### What's Running

```
✅ Frontend:  http://localhost:3000
✅ API:       http://localhost:3000/api/*
✅ Images:    http://localhost:3000/uploads/issues/*
✅ Health:    http://localhost:3000/health
```

### File Structure

```
d:\Repos\Personal\MyrIK\
├── app.js                 (Express server)
├── issueController.js     (API routes)
├── issueService.js        (Business logic)
├── issueModels.js         (Data models)
├── package.json           (Dependencies)
├── index-tabbed.html      (Frontend UI)
├── app.js                 (Frontend logic)
├── map-leaflet.js         (Map manager)
├── .env.example           (Environment template)
└── uploads/issues/        (Uploaded images)
```

---

## You're Ready!

```
1. Run: npm install
2. Run: mkdir -p uploads/issues
3. Run: npm start
4. Open: http://localhost:3000
5. Use the app!
```

That's it! Both backend API and frontend UI are running together on port 3000. 🚀
