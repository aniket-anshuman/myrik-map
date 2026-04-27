# 🚀 Quick Start Guide

## One Command to Run Everything

```bash
npm start
```

This single command will:
1. ✅ Install any missing dependencies (first time only)
2. ✅ Start the SQLite backend server
3. ✅ Open the Issue Reporting UI in your browser automatically
4. ✅ Keep both running live together

## What Happens

```
🚀 Starting Issue Reporting System...

[Server Output]
✓ Database initialized
✓ Server running on http://localhost:3000

📱 Opening browser at http://localhost:3000/index-tabbed.html
```

The browser opens automatically with the UI loaded and ready to use!

## Available Commands

| Command | What it does |
|---------|-------------|
| `npm start` | **Start backend + open UI (Recommended)** |
| `npm run server` | Start only the backend server |
| `npm run dev` | Start server with auto-reload on file changes |

## Manual Browser Access

If the browser doesn't open, manually visit:
```
http://localhost:3000/index-tabbed.html
```

## Stop the Application

Press `Ctrl + C` in the terminal to stop both server and browser.

## Database

- SQLite database file: `issues.db` (created automatically)
- All data persists between sessions
- No localStorage - everything is in the database

## Features Available

✨ **Report Issues** - Add location-based issues with images  
🗺️ **Interactive Map** - View all issues on Leaflet map  
📊 **Statistics** - Total, open, and category breakdowns  
🔍 **Search & Filter** - Find issues by status or category  
💬 **Comments** - Add notes to issues  

## Troubleshooting

### Port 3000 already in use
```bash
PORT=3001 npm start
```

### Browser doesn't open
Visit `http://localhost:3000/index-tabbed.html` manually

### Database locked
Delete `issues.db` and restart - it will recreate automatically

### API errors in browser console
Make sure the server is running (`npm start` or `npm run server`)
