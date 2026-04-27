# 🇮🇳 India Map with Constituency-Based Issues

## What's Changed

✅ **Map Center**: Changed from New York to **India** (20.59°N, 78.96°E)  
✅ **Zoom Level**: Changed to show entire India (zoom level 5)  
✅ **Test Data**: Updated with Indian constituencies and locations  
✅ **Issues**: 8 sample issues across major Indian constituencies  

## Indian Constituencies with Issues

| # | Constituency | State | Issue | Status |
|---|---|---|---|---|
| 1 | Gurugram | Haryana | Pothole on NH-48 | 🔴 Open |
| 2 | Mumbai Central | Maharashtra | Street light not working | 🟠 In Progress |
| 3 | Delhi North | Delhi | Road damage on Grand Trunk Road | 🔴 Open |
| 4 | Bangalore South | Karnataka | Broken sidewalk | 🟢 Resolved |
| 5 | Kolkata South West | West Bengal | Drainage blockage | 🔴 Open |
| 6 | Chennai Central | Tamil Nadu | Traffic sign damaged | 🔴 Open |
| 7 | Hyderabad East | Telangana | Tree overgrowth blocking path | 🟠 In Progress |
| 8 | Pune | Maharashtra | Pothole on MG Road | 🔴 Open |

## Coordinates Used

**Major Cities/Constituencies:**
- **Delhi North**: 28.7465°N, 77.1113°E
- **Gurugram**: 28.4089°N, 77.0066°E
- **Mumbai Central**: 19.0176°N, 72.8479°E
- **Bangalore South**: 12.9716°N, 77.5946°E
- **Kolkata South West**: 22.5726°N, 88.3639°E
- **Chennai Central**: 13.0499°N, 80.2624°E
- **Hyderabad East**: 17.3667°N, 78.5243°E
- **Pune**: 18.5204°N, 73.8567°E

## How to View

### Step 1: Start the System
```bash
npm start
```

### Step 2: Browser Opens Automatically
- Opens to `http://localhost:3000/index-tabbed.html`

### Step 3: Click Map Tab
- Click the **"Map"** button at the top

### Step 4: See India Map with Issues
- 🗺️ Full India map displayed
- 🔴 Red markers = Open issues (5)
- 🟠 Orange markers = In Progress issues (2)
- 🟢 Green markers = Resolved issues (1)

## Interactive Features

### View Issue Details
- **Click any marker** to see:
  - Issue title
  - Constituency/Location
  - Category (Pothole, Street Light, etc.)
  - Status
  - Date created
  - Attached image thumbnail

### Filter by Status
- Use **"Filter"** dropdown in Map toolbar
- View only: Open, In Progress, or Resolved issues

### Change Map Style
- Use **"Map Style"** dropdown to switch between:
  - OpenStreetMap (default)
  - Topographic
  - CartoDB
  - USGS

### Navigation Controls
- **Scroll wheel** - Zoom in/out
- **Drag** - Pan the map
- **Fit All Markers** - Auto-fit all issues in view
- **Clear Filter** - Reset all filters

## Sample Issues

### 1. Gurugram (Haryana)
**Issue**: Pothole on NH-48 near Gurugram  
**Status**: Open (5 days old)  
**Coordinates**: 28.4089°N, 77.0066°E

### 2. Mumbai (Maharashtra)
**Issue**: Street light not working in Mumbai Central  
**Status**: In Progress (3 days old)  
**Coordinates**: 19.0176°N, 72.8479°E

### 3. Delhi North
**Issue**: Road damage on Grand Trunk Road  
**Status**: Open (2 days old)  
**Coordinates**: 28.7465°N, 77.1113°E

### 4. Bangalore South (Karnataka)
**Issue**: Broken sidewalk  
**Status**: Resolved (10 days old)  
**Coordinates**: 12.9716°N, 77.5946°E

### 5. Kolkata South West (West Bengal)
**Issue**: Drainage blockage  
**Status**: Open (1 day old)  
**Coordinates**: 22.5726°N, 88.3639°E

### 6. Chennai Central (Tamil Nadu)
**Issue**: Traffic sign damaged  
**Status**: Open (6 hours old)  
**Coordinates**: 13.0499°N, 80.2624°E

### 7. Hyderabad East (Telangana)
**Issue**: Tree overgrowth blocking path  
**Status**: In Progress (4 days old)  
**Coordinates**: 17.3667°N, 78.5243°E

### 8. Pune (Maharashtra)
**Issue**: Pothole on MG Road  
**Status**: Open (12 hours old)  
**Coordinates**: 18.5204°N, 73.8567°E

## Statistics

- **Total Issues**: 8
- **Open Issues**: 5
- **In Progress**: 2
- **Resolved**: 1
- **Coverage**: 6 states across India

## Adding Your Own Issues

### From the Map
1. Click **"Report Issue"** tab
2. Fill in details:
   - Description
   - Category (Pothole, Street Light, Sidewalk, etc.)
   - Constituency/Location (latitude/longitude)
   - Upload image
3. Click **"Submit Issue"**
4. Go to **"Map"** tab
5. New marker appears on India map!

### Getting Coordinates for Indian Locations
Use Google Maps:
1. Right-click on location
2. Click coordinates at the top
3. Copy latitude and longitude
4. Paste into the form

Example:
- Delhi: 28.7041, 77.1025
- Mumbai: 19.0760, 72.8777
- Bangalore: 12.9716, 77.5946
- Chennai: 13.0827, 80.2707

## Features by Constituency

### Real-time Updates
- Add new issues from any constituency
- Instantly see markers on map
- Filter and view details

### Status Management
- Change issue status (Open → In Progress → Resolved)
- Marker color updates automatically
- Statistics update in real-time

### Search & Filter
- Filter by status
- Filter by category
- Search by keyword
- View by geographical region

## Technical Details

### Map Library
- **Leaflet.js** v1.9.4
- **OpenStreetMap** tiles
- **Marker Clustering** for grouped locations

### Database
- SQLite database stores all issues
- Persistent storage across sessions
- API endpoints for CRUD operations

### Coordinates
- **Format**: Latitude, Longitude (decimal degrees)
- **Range**: Valid for India (-6 to 37°N, 68 to 97°E)
- **Precision**: 4 decimal places (≈11 meters accuracy)

## Tips

✅ Click markers to see full details  
✅ Use different map styles to find constituencies better  
✅ Filter by status to focus on specific issues  
✅ Zoom to constituency level for better visibility  
✅ Add issues with accurate coordinates for better clustering  

## Next Steps

1. ✅ Run `npm start`
2. ✅ Click Map tab
3. ✅ Explore India with 8 constituencies
4. ✅ Add your own issues from any Indian location
5. ✅ Filter, search, and manage issues in real-time

---

**India Map is now live! 🇮🇳🗺️**
