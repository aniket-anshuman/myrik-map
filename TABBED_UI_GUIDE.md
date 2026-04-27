# Tabbed UI Guide - Issue Reporting System

## Overview

The new interface uses a **two-tab layout** for better organization:

- **Tab 1: Report Issue** 📝 - Form to submit new issues
- **Tab 2: Map View** 🗺️ - Interactive map with location-based counts

---

## Tab 1: Report Issue

### Layout (3-Column Grid)

```
┌─────────────────────────────────────────────────────────┐
│            📝 Report New Issue  │  📊 Dashboard  │  🕐 Recent │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Column 1: Form                                           │
│  - Issue Description                                      │
│  - Category Select                                        │
│  - Latitude/Longitude Input                              │
│  - 📍 Use Current Location Button                        │
│  - Image Upload (Drag & Drop)                            │
│  - Submit Button                                         │
│                                                           │
│  Column 2: Statistics                                     │
│  - Total Issues Count                                     │
│  - Open Issues Count                                      │
│  - Issues by Category (breakdown)                        │
│                                                           │
│  Column 3: Recent Issues                                 │
│  - Last 5 reported issues                                │
│  - Quick reference                                        │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### Features

✅ **Form Validation**
- Required fields marked with *
- Coordinate validation (-90 to 90, -180 to 180)
- Image file type checking (JPEG, PNG, GIF, WebP)
- File size validation (Max 5MB)

✅ **Geolocation**
- Click "📍 Use Current Location" to auto-fill coordinates
- Requires browser permission
- Falls back to manual entry

✅ **Image Upload**
- Click to upload or drag-and-drop
- Shows preview before submission
- Displays file name

✅ **Statistics**
- Real-time count updates
- Category breakdown with visual indicators
- Recent issues list

---

## Tab 2: Map View

### Layout

```
┌────────────────────────────────────────────────────┐
│  Map Toolbar (Style, Filter, Actions)              │
├────────────────────────────────────────────────────┤
│                                                      │
│  📍 Interactive Leaflet Map                         │
│  - Color-coded markers by status                    │
│  - Clickable for details                            │
│  - Marker clustering at zoom out                    │
│  - Pan & zoom enabled                              │
│                                                      │
├────────────────────────────────────────────────────┤
│  📊 Statistics Below Map                            │
│  - Issues on Map                                    │
│  - Open Issues Count                                │
│  - In Progress Count                                │
│  - Resolved Count                                   │
│                                                      │
└────────────────────────────────────────────────────┘
```

### Map Features

✅ **Color-Coded Markers**
```
🔴 Red    = Open (needs action)
🟠 Orange = In Progress (being worked on)
🟢 Green  = Resolved (fixed)
⚫ Grey   = Closed
```

✅ **Map Toolbar**

| Control | Function |
|---------|----------|
| **Map Style** | Switch between OpenStreetMap, Topographic, CartoDB, USGS |
| **Filter** | Show only: All, Open, In Progress, or Resolved |
| **📍 Fit All** | Center map to show all markers |
| **🔄 Clear Filter** | Reset all filters and highlighting |

✅ **Marker Interactions**
- Click marker to see issue details in popup
- Popup includes: title, category, location, status, image
- Drag map to pan
- Scroll to zoom

✅ **Statistics**
- Dynamic counts based on visible markers
- Updates when switching tabs
- Shows status breakdown

---

## Usage Workflow

### Reporting an Issue

```
1. Tab 1 - Report Issue
2. Fill in Issue Description
3. Select Category
4. Enter Location (manual or auto-detect)
5. Upload Image
6. Click "Submit Issue"
7. Success! Issue appears in statistics
```

### Viewing Issues on Map

```
1. Click Tab 2 - Map View
2. Map loads with all issues as markers
3. Markers color-coded by status
4. Use controls to:
   - Change map style
   - Filter by status
   - Fit all in view
5. Click marker for details
6. See count statistics below map
```

---

## Data Structure

### Local Storage

Issues are stored in localStorage with this structure:

```javascript
{
  id: "1gb2dkpq4x",
  issue: "Large pothole on Main Street",
  category: "Pothole",
  latitude: 40.7128,
  longitude: -74.0060,
  imageData: {
    data: "data:image/jpeg;base64,...", // Base64 encoded
    name: "photo.jpg",
    size: 2048000,
    type: "image/jpeg"
  },
  createdAt: "2026-04-27T10:30:00.000Z",
  status: "open",
  comments: []
}
```

### Browser Console Access

```javascript
// View all issues
JSON.parse(localStorage.getItem('issues'))

// Get specific issue
JSON.parse(localStorage.getItem('issues'))[0]

// Count issues
JSON.parse(localStorage.getItem('issues')).length

// Clear all data
localStorage.removeItem('issues')
```

---

## Customization

### Change Default Location (Startup Map Center)

In `map-leaflet.js`, find this line:

```javascript
this.map = L.map(containerId).setView([40.7128, -74.0060], 13);
```

Change `[40.7128, -74.0060]` to your desired [latitude, longitude]

### Add More Categories

In `index-tabbed.html`, find the category select:

```html
<select id="category" name="category" required>
    <option value="">Select a category</option>
    <option value="Your Category">Your Category</option>
    <!-- Add more options here -->
</select>
```

Also update in `app.js`:

```javascript
this.categories = [
  'Road Damage',
  'Your Category', // Add here
  'Other'
];
```

### Change Map Tiles

In `map-leaflet.js`, the `tileLayers` object:

```javascript
const tileLayers = {
  osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  topo: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
  // Add more tile layers here
};
```

Free tile layers:
- OpenStreetMap: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
- Topographic: `https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png`
- CartoDB: `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png`
- USGS: `https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}`

---

## Performance Notes

### Lazy Loading

The map is **lazy-loaded**:
- Only initializes when you switch to Tab 2
- Saves memory and startup time
- Automatically resizes when switching tabs

### Large Datasets

With 100+ issues:
- Use marker clustering (enabled by default)
- Filter by status to reduce markers
- Use location-based radius search

### Storage Limits

- localStorage limit: ~10MB
- Each issue with image: ~1-2MB
- Practical limit: 5-10 issues before migration to database

---

## Status Transitions

Users can change issue status through marker context menu:

```
open → in-progress → resolved → closed
```

Or click buttons in the issues list:
- **In Progress** - Mark as being worked on
- **✓ Resolved** - Mark as fixed
- **Reopen** - Revert to open status

---

## Features by Tab

### Report Tab
| Feature | Enabled |
|---------|---------|
| Submit new issues | ✅ |
| Upload images | ✅ |
| View statistics | ✅ |
| See recent issues | ✅ |
| Edit/delete issues | ⏳ (Coming) |
| Search issues | ⏳ (Coming) |

### Map Tab
| Feature | Enabled |
|---------|---------|
| View all issues on map | ✅ |
| Color-coded by status | ✅ |
| Interactive markers | ✅ |
| Change map style | ✅ |
| Filter by status | ✅ |
| Location-based counts | ✅ |
| Marker clustering | ✅ |
| Search radius | ⏳ (Coming) |
| Heatmap view | ⏳ (Coming) |

---

## Mobile Responsiveness

The interface is fully responsive:

| Screen Size | Layout |
|------------|--------|
| Desktop (1200px+) | 3-column form, full map |
| Tablet (768-1200px) | 2-column form, resized map |
| Mobile (<768px) | 1-column, stacked layout, 400px map |

---

## File Structure

```
index-tabbed.html       # Main tabbed interface (USE THIS!)
├── Styles (inline CSS)
├── HTML Structure
└── JavaScript (tab management + map integration)

map-leaflet.js          # Leaflet map manager
app.js                  # Core application logic
```

---

## Quick Start

### 1. Open in Browser

```bash
# Just open the file directly
open index-tabbed.html
# or
python -m http.server 8000
# Then go to http://localhost:8000/index-tabbed.html
```

### 2. Start Using

```
1. Click "Report Issue" tab
2. Fill form and submit
3. See statistics update
4. Click "Map View" tab
5. See issues on map with counts
```

### 3. Test It

```javascript
// In browser console, add test issue programmatically:
const testIssue = {
  id: Date.now().toString(),
  issue: 'Test pothole',
  category: 'Pothole',
  latitude: 40.7128,
  longitude: -74.0060,
  createdAt: new Date().toISOString(),
  status: 'open'
};
let issues = JSON.parse(localStorage.getItem('issues')) || [];
issues.push(testIssue);
localStorage.setItem('issues', JSON.stringify(issues));
location.reload();
```

---

## Future Enhancements

- [ ] Search functionality
- [ ] Radius-based filtering on map
- [ ] Heatmap visualization
- [ ] Issue comments/updates
- [ ] Severity ratings
- [ ] Photo gallery per issue
- [ ] Export as CSV/PDF
- [ ] Social sharing
- [ ] Admin dashboard
- [ ] User authentication
- [ ] Real-time notifications
- [ ] API integration (when moving to database)

---

## Troubleshooting

### Map not showing?
```javascript
// In browser console:
console.log(window.app); // Check if app initialized
console.log(window.mapManager); // Check if map manager exists
```

### localStorage issues?
```javascript
// Check storage
localStorage.getItem('issues')

// Clear if corrupted
localStorage.removeItem('issues')
```

### Images not displaying?
- Ensure image is under 5MB
- Check file type (JPEG, PNG, GIF, WebP)
- Open DevTools → Console for errors

### Tab switching freezing?
- Check if map has too many markers (100+)
- Try filtering by status first
- Refresh page if stuck

---

## Summary

✨ **Beautiful, functional, two-tab UI** for issue reporting
- Easy to submit issues
- Easy to visualize on map
- Real-time statistics
- Mobile responsive
- Ready for production

🚀 **Ready to use now** with localStorage
📦 **Easy to migrate** to database later

---

Enjoy your issue reporting system! 🎉
