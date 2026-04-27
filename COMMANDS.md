# Complete Command Reference

Quick reference for all commands to run the Issue Reporting System.

---

## 🚀 START HERE - Quickest Way

### For Windows Users

#### Option 1: Double-click (Easiest)
```
Just double-click: START.bat
```

#### Option 2: Command Prompt/PowerShell
```bash
npm install && mkdir uploads\issues && npm start
```

### For Mac/Linux Users

#### Option 1: Make script executable
```bash
chmod +x start.sh
./start.sh
```

#### Option 2: Direct commands
```bash
npm install && mkdir -p uploads/issues && npm start
```

---

## 📋 All Commands by Task

### Installation & Setup

| Command | What it does |
|---------|-------------|
| `npm install` | Install all dependencies |
| `mkdir -p uploads/issues` | Create upload directory |
| `cp .env.example .env` | Create environment file |

### Starting the Server

| Command | Mode | When to use |
|---------|------|------------|
| `npm start` | **Production** | Normal operation |
| `npm run dev` | **Development** | During coding (auto-reload) |
| `node app.js` | **Direct** | Testing only |

### Checking Status

| Command | Purpose |
|---------|---------|
| `npm list` | Show installed packages |
| `npm outdated` | Check for updates |
| `curl http://localhost:3000/health` | Test if server is running |

### Cleaning Up

| Command | What it does |
|---------|-------------|
| `rm -rf node_modules` | Remove node packages |
| `npm cache clean --force` | Clear npm cache |
| `rm -rf uploads/issues/*` | Delete all images |

### Port Management

| Command | Purpose | OS |
|---------|---------|-----|
| `netstat -ano \| findstr :3000` | Find process on port 3000 | Windows |
| `lsof -i :3000` | Find process on port 3000 | Mac/Linux |
| `taskkill /PID <PID> /F` | Kill process by ID | Windows |
| `kill -9 <PID>` | Kill process by ID | Mac/Linux |

---

## 🔥 One-Line Commands

### Windows

```bash
# Install + Create dir + Start
npm install && mkdir uploads\issues && npm start

# Start with custom port
set PORT=3001 && npm start

# Full clean reinstall
rmdir /s /q node_modules && npm install && npm start
```

### Mac/Linux

```bash
# Install + Create dir + Start
npm install && mkdir -p uploads/issues && npm start

# Start with custom port
PORT=3001 npm start

# Full clean reinstall
rm -rf node_modules && npm install && npm start
```

---

## 🎯 Common Scenarios

### Scenario 1: Fresh Start

```bash
# 1. Navigate to project
cd d:\Repos\Personal\MyrIK

# 2. Install everything
npm install

# 3. Create directories
mkdir uploads\issues

# 4. Start
npm start

# 5. Open browser
# http://localhost:3000
```

### Scenario 2: Start Using Startup Script

**Windows:**
```bash
# Just double-click START.bat
# Or run from command prompt:
START.bat
```

**Mac/Linux:**
```bash
./start.sh
```

### Scenario 3: Development Mode (Auto-reload)

```bash
# Install nodemon first
npm install -g nodemon
# OR
npm install --save-dev nodemon

# Start with auto-reload
npm run dev
```

### Scenario 4: Use Different Port

**Windows:**
```bash
set PORT=3001
npm start
```

**Mac/Linux:**
```bash
PORT=3001 npm start
```

### Scenario 5: Troubleshoot Port Conflict

**Windows:**
```bash
# Find what's using 3000
netstat -ano | findstr :3000

# Kill it (replace PID with actual number)
taskkill /PID 1234 /F

# Start server
npm start
```

**Mac/Linux:**
```bash
# Find what's using 3000
lsof -i :3000

# Kill it (replace PID with actual number)
kill -9 1234

# Start server
npm start
```

### Scenario 6: Full Reset

**Windows:**
```bash
# Remove everything
rmdir /s /q node_modules
del package-lock.json

# Reinstall
npm install

# Create directories
mkdir uploads\issues

# Start fresh
npm start
```

**Mac/Linux:**
```bash
# Remove everything
rm -rf node_modules package-lock.json

# Reinstall
npm install

# Create directories
mkdir -p uploads/issues

# Start fresh
npm start
```

---

## 🧪 Testing Commands

### Test API Endpoints

```bash
# Health check
curl http://localhost:3000/health

# Get all issues
curl http://localhost:3000/api/issues

# Get statistics
curl http://localhost:3000/api/issues-stats

# Get count by category
curl http://localhost:3000/api/issues-count/category/Pothole

# Get count by status
curl http://localhost:3000/api/issues-count/status/open
```

### Test File Upload

**Windows (PowerShell):**
```powershell
$FilePath = "C:\path\to\image.jpg"
$Uri = "http://localhost:3000/api/issues"
$Form = @{
    issue = "Test pothole"
    category = "Pothole"
    latitude = 40.7128
    longitude = -74.0060
    image = Get-Item -Path $FilePath
}
Invoke-WebRequest -Uri $Uri -Method Post -Form $Form
```

**Mac/Linux (bash):**
```bash
curl -X POST http://localhost:3000/api/issues \
  -F "issue=Test pothole" \
  -F "category=Pothole" \
  -F "latitude=40.7128" \
  -F "longitude=-74.0060" \
  -F "image=@/path/to/image.jpg"
```

### Open in Browser

```bash
# Windows
start http://localhost:3000

# Mac
open http://localhost:3000

# Linux
xdg-open http://localhost:3000
```

---

## 📁 Directory Operations

### Create Directories

```bash
# Windows
mkdir uploads\issues
mkdir uploads\backup

# Mac/Linux
mkdir -p uploads/issues
mkdir -p uploads/backup
```

### List Files

```bash
# Windows
dir /s

# Mac/Linux
ls -la
```

### View File Contents

```bash
# Windows
type package.json

# Mac/Linux
cat package.json
```

---

## 🔐 Environment Variables

### Set Temporarily (Windows CMD)

```bash
set PORT=3001
set NODE_ENV=production
npm start
```

### Set Temporarily (Windows PowerShell)

```powershell
$env:PORT=3001
$env:NODE_ENV=production
npm start
```

### Set Temporarily (Mac/Linux)

```bash
PORT=3001 NODE_ENV=production npm start
```

### Set Permanently (Windows)

```bash
# System Properties → Environment Variables
# Add new variable:
# Name: PORT
# Value: 3001
```

### Set Permanently (Mac/Linux ~/.bashrc or ~/.zshrc)

```bash
export PORT=3001
export NODE_ENV=production
```

---

## 🐳 Docker Commands (Advanced)

```bash
# Build image
docker build -t issue-reporting-api .

# Run container
docker run -p 3000:3000 \
  -v $(pwd)/uploads:/app/uploads \
  issue-reporting-api

# View logs
docker logs <container-id>

# Stop container
docker stop <container-id>

# Remove container
docker rm <container-id>
```

---

## 📦 npm Commands

### Helpful npm Commands

| Command | Purpose |
|---------|---------|
| `npm -v` | Check npm version |
| `npm list` | List installed packages |
| `npm outdated` | Check for updates |
| `npm update` | Update all packages |
| `npm install <package>` | Install specific package |
| `npm uninstall <package>` | Remove package |
| `npm start` | Run start script |
| `npm test` | Run tests |
| `npm run` | List available scripts |
| `npm cache clean --force` | Clear cache |

---

## 🔍 Debugging

### Check Installation

```bash
# Verify Node.js
node -v
npm -v

# List dependencies
npm list

# Check for issues
npm audit

# Fix vulnerabilities
npm audit fix
```

### Check Server

```bash
# Test connection
curl http://localhost:3000

# Check port usage
netstat -tulpn | grep :3000  # Linux
netstat -ano | findstr :3000 # Windows
lsof -i :3000                # Mac

# View logs
npm start -- --debug

# Check file uploads
ls -la uploads/issues/        # Mac/Linux
dir uploads\issues            # Windows
```

### Validate Code

```bash
# Check syntax
node --check app.js

# Run with verbose output
NODE_DEBUG=* npm start
```

---

## ⏸️ Stop & Cleanup

### Stop Server

```bash
# In the terminal where it's running
Ctrl + C
```

### Kill Hung Process

**Windows:**
```bash
taskkill /F /IM node.exe
```

**Mac/Linux:**
```bash
killall node
```

### Clear Cache & Reinstall

```bash
# Windows
rmdir /s /q node_modules && del package-lock.json && npm install

# Mac/Linux
rm -rf node_modules package-lock.json && npm install
```

---

## 📊 Directory Structure

Check what was created:

```bash
# List all files
ls -la          # Mac/Linux
dir /s          # Windows

# Show tree structure
tree            # Mac/Linux
tree /f         # Windows

# List just uploads
ls -la uploads/issues/          # Mac/Linux
dir uploads\issues              # Windows

# Count files
ls -1 uploads/issues | wc -l    # Mac/Linux
dir uploads\issues /s/b | find /c /:  # Windows
```

---

## 🆘 Quick Help

### Forgot how to start?

```bash
# Windows - Run this from project directory:
START.bat

# Mac/Linux - Run this from project directory:
./start.sh
```

### Something broken?

```bash
# Clean reinstall:
npm install
mkdir -p uploads/issues
npm start
```

### Want to use different port?

```bash
# Windows
set PORT=3001 && npm start

# Mac/Linux
PORT=3001 npm start
```

### Want to see all changes in real-time?

```bash
npm install -g nodemon
npm run dev
```

---

## 📚 Useful Aliases (Optional)

Add to your shell config (`.bashrc`, `.zshrc`, or Windows Registry):

```bash
# Mac/Linux (~/.bashrc or ~/.zshrc)
alias start-api="npm install && mkdir -p uploads/issues && npm start"
alias clean-api="rm -rf node_modules && npm install"
alias kill-3000="lsof -i :3000 | grep LISTEN | awk '{print \$2}' | xargs kill -9"

# Then use:
start-api
clean-api
kill-3000
```

---

## 📋 Summary Table

| Task | Windows | Mac/Linux |
|------|---------|----------|
| Install | `npm install` | `npm install` |
| Create dirs | `mkdir uploads\issues` | `mkdir -p uploads/issues` |
| Start | `npm start` | `npm start` |
| Dev mode | `npm run dev` | `npm run dev` |
| Kill port 3000 | `taskkill /PID <PID> /F` | `kill -9 <PID>` |
| Clean install | `rmdir /s /q node_modules && npm i` | `rm -rf node_modules && npm i` |

---

## ✅ Verification Checklist

After starting, verify:

- [ ] Server running (`npm start` shows no errors)
- [ ] Browser loads (`http://localhost:3000` shows UI)
- [ ] API responsive (`curl http://localhost:3000/api/issues`)
- [ ] Upload dir exists (`uploads/issues/` folder present)
- [ ] Can submit issue (form works, no console errors)
- [ ] Map loads (Tab 2 shows interactive map)

If all ✅, you're good to go! 🚀

---

## 🎓 Learning Resources

- [Express.js Docs](https://expressjs.com/)
- [Node.js Docs](https://nodejs.org/docs/)
- [npm Docs](https://docs.npmjs.com/)
- [Leaflet Maps](https://leafletjs.com/)
- [REST API Best Practices](https://restfulapi.net/)

---

That's it! You have everything you need to run the complete system. 🎉
