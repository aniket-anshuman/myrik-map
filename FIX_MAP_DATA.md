# Fix: Map Not Showing Data

## Problem
The map is empty because:
1. ✗ No data in SQLite database
2. ✗ API returns empty array
3. ✗ Seed data needs to be added

## Solution: 3 Steps to Get Live Map with Data

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Seed the Database with Test Data
```bash
npm run seed
```

Output:
```
🌱 Starting database seed...
✅ Database initialized
✅ Cleared existing data
✅ Created issue: Large pothole on Main Street
✅ Created issue: Street light not working on 5th Avenue
... (8 test issues total)
✨ Seeded 8 test issues
🗺️  Issues are now visible on the map!
```

### Step 3: Start the System
```bash
npm start
```

This will:
- ✅ Start the backend server
- ✅ Automatically open the UI
- ✅ Load all 8 test issues from database
- ✅ Display them on the interactive map

## What You'll See

**Map View Tab:**
- 🗺️ 8 colored markers on NYC area map
- 📍 Red markers = Open issues
- 🟠 Orange markers = In Progress issues
- 🟢 Green markers = Resolved issues
- Filter by status dropdown
- Different map styles (OpenStreetMap, Topographic, etc.)

**Statistics:**
- Total Issues: 8
- Open Issues: 5
- In Progress: 2
- Resolved: 1

**Sample Issues in Database:**
1. Large pothole on Main Street
2. Street light not working on 5th Avenue
3. Road damage near Central Park
4. Broken sidewalk near Times Square
5. Drainage issue causing flooding
6. Traffic sign damaged
7. Vegetation overgrowth blocking path
8. Another pothole on Broadway

## Verify It's Working

### Check API Response
```bash
curl http://localhost:3000/api/issues
```

Expected response:
```json
{
  "success": true,
  "data": [
    {
      "id": "issue-001",
      "issue": "Large pothole on Main Street",
      "category": "Pothole",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "status": "open",
      ...
    },
    ...
  ],
  "count": 8
}
```

### Check Browser Console
No errors should appear. Map should show 8 markers.

## Commands Reference

| Command | Purpose |
|---------|---------|
| `npm install` | Install dependencies |
| `npm run seed` | Add 8 test issues to database |
| `npm start` | Start server + open UI |
| `npm run server` | Start server only |
| `npm run dev` | Dev mode with auto-reload |

## Troubleshooting

### Map still empty?
1. Open browser DevTools (F12)
2. Go to Console tab
3. Check for errors
4. Ensure server is running: `npm start`
5. Refresh the page (Ctrl+R)

### API returns empty array?
```bash
npm run seed
```
Then restart the server.

### Port 3000 already in use?
```bash
PORT=3001 npm start
```

### Database file locked?
```bash
# Delete and recreate
del issues.db
npm run seed
npm start
```

## What's Different Now

✨ **Before:**
- Data stored in browser localStorage
- Lost on page refresh or device change
- Limited to single browser

✨ **Now:**
- Data stored in SQLite database (persistent)
- Available across all browsers/devices
- RESTful API for all operations
- Real-time synchronization

## Next Steps

Once everything is running:
1. Click "Report Issue" to add new issues
2. Upload images with issues
3. Watch markers appear on map instantly
4. Filter and manage issues in real-time
