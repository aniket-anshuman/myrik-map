# Issue Reporting System

A location-based issue reporting application where users can report civic issues (potholes, street lights, etc.) with images, categories, and GPS coordinates.

## Features

### 🎯 Current Features (Frontend with localStorage)

- **Report Issues**
  - Describe the issue
  - Select category
  - Input latitude & longitude or use GPS
  - Upload image (JPEG, PNG, GIF, WebP)
  - Drag-and-drop support for images

- **View & Manage Issues**
  - Browse all reported issues
  - Filter by category
  - Search issues
  - View issue images in modal
  - Mark issues as in-progress or resolved

- **Dashboard**
  - Total issue count
  - Open issues count
  - Category breakdown with progress bars
  - Recent issues list

- **Data Persistence**
  - All data stored in browser localStorage
  - Data persists across sessions

---

## Quick Start

### Option 1: Direct Browser Usage

1. **Open in Browser**
   ```bash
   # Simply open the file in your browser
   # File → Open → index.html
   # Or serve locally:
   python -m http.server 8000
   # Then go to http://localhost:8000
   ```

2. **Report an Issue**
   - Fill in the form with issue details
   - Click "📍 Use Current Location" (requires permission)
   - Upload an image by clicking the upload area or dragging
   - Click "Submit Issue"

3. **View Issues**
   - Scroll down to see all reported issues
   - Use search and category filter to narrow results
   - Click image to view full size
   - Change issue status or delete

### Option 2: With Node.js Server

If you want to test with the REST API later:

```bash
npm install
npm start
# Server runs on http://localhost:3000
```

---

## Project Structure

```
├── index.html              # Main HTML page with form and UI
├── app.js                  # JavaScript application logic
├── issueController.js      # REST API endpoints (Node.js)
├── issueService.js         # Business logic layer
├── issueModels.js          # Data models
├── app.js (Node)           # Express server setup
├── package.json            # Dependencies
└── API_DOCUMENTATION.md    # API reference
```

---

## How localStorage Works

### Data Structure

Each issue is stored as a JSON object:

```json
{
  "id": "1gb2dkpq4x",
  "issue": "Large pothole",
  "category": "Road Damage",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "imageData": {
    "data": "data:image/jpeg;base64,...",
    "name": "photo.jpg",
    "size": 2048000,
    "type": "image/jpeg"
  },
  "createdAt": "2026-04-27T10:30:00.000Z",
  "status": "open",
  "comments": []
}
```

### Browser Console Access

```javascript
// View all issues
JSON.parse(localStorage.getItem('issues'))

// Clear all data
localStorage.removeItem('issues')

// Check storage size
console.log(new Blob([localStorage.getItem('issues')]).size)
```

---

## Migrating to Database

When ready to switch from localStorage to MongoDB:

### Step 1: Backend Setup

The Node.js backend is already prepared! Use the provided files:

- `issueController.js` - API endpoints
- `issueService.js` - Business logic
- `issueModels.js` - Data models
- `package.json` - Dependencies

### Step 2: Install & Start

```bash
npm install
npm start
```

### Step 3: Update Frontend (app.js)

Modify the relevant methods in `app.js`:

```javascript
// Replace localStorage methods with API calls:

// OLD: Save to localStorage
saveIssuesToStorage() {
  localStorage.setItem('issues', JSON.stringify(this.issues));
}

// NEW: POST to API
async saveIssuesToStorage() {
  const response = await fetch('/api/issues', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(this.currentIssue)
  });
  return response.json();
}
```

### Step 4: Update Other Methods

```javascript
// Load from API instead of localStorage
async loadIssuesFromStorage() {
  const response = await fetch('/api/issues');
  this.issues = await response.json();
}

// Delete via API
async deleteIssue(id) {
  await fetch(`/api/issues/${id}`, { method: 'DELETE' });
  // ... update UI
}

// Update status via API
async updateIssueStatus(id, status) {
  await fetch(`/api/issues/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  // ... update UI
}
```

### Step 5: Handle Image Upload

The frontend currently stores base64 images. For production:

```javascript
// Use FormData for multipart upload
const formData = new FormData();
formData.append('issue', issue);
formData.append('category', category);
formData.append('latitude', latitude);
formData.append('longitude', longitude);
formData.append('image', imageFile); // File object, not base64

const response = await fetch('/api/issues', {
  method: 'POST',
  body: formData
});
```

---

## localStorage Limitations & Constraints

### Storage Limits

| Browser | Limit | Notes |
|---------|-------|-------|
| Chrome | 10MB | Per origin |
| Firefox | 10MB | Per origin |
| Safari | 5MB | Per domain |
| IE | 10MB | Per domain |
| Edge | 10MB | Per origin |

### Image Storage Impact

- Each base64 image is ~33% larger than binary
- A 1MB image = ~1.3MB in localStorage
- With multiple images, you'll hit limits quickly

### Practical Limits

With typical 1-2MB images:
- ~5-10 issues before storage concerns
- Recommended to migrate to database after 10-20 issues

### Check Storage Usage

```javascript
function getStorageSize() {
  let total = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length + key.length;
    }
  }
  return (total / 1024 / 1024).toFixed(2) + ' MB';
}

console.log('Storage used:', getStorageSize());
```

---

## Using GPS/Geolocation

### Enable Location Permission

1. Click "📍 Use Current Location" button
2. Browser will ask for permission
3. Coordinates auto-populate if granted

### Manual Entry

- Latitude: -90 to 90
- Longitude: -180 to 180

### Common Locations (for testing)

```
New York City:      40.7128, -74.0060
San Francisco:      37.7749, -122.4194
London:             51.5074, -0.1278
Tokyo:              35.6762, 139.6503
Sydney:             -33.8688, 151.2093
```

---

## API Endpoints (When Using Node.js)

Once you switch to the backend, these endpoints are available:

```bash
# Create issue (multipart/form-data)
POST /api/issues

# Get all issues
GET /api/issues
GET /api/issues?category=Road%20Damage
GET /api/issues?latitude=40.7128&longitude=-74.0060&radius=5

# Get single issue
GET /api/issues/:id

# Statistics
GET /api/issues-count/total
GET /api/issues-count/category/:category
GET /api/issues-count/status/:status
GET /api/issues-stats
```

See `API_DOCUMENTATION.md` for full details.

---

## Troubleshooting

### Images not saving?

```javascript
// Check if FileReader is supported
if (!window.FileReader) {
  console.error('FileReader not supported');
}

// Check localStorage availability
if (!window.localStorage) {
  console.error('localStorage not available');
}
```

### localStorage full?

```javascript
// Clear all data
localStorage.clear();

// Or remove specific key
localStorage.removeItem('issues');
```

### Coordinates not auto-filling?

1. Check browser allows location access
2. Disable VPN/Proxy
3. Check browser privacy settings
4. Use manual entry instead

### Image upload fails?

- Ensure file is under 5MB
- Supported formats: JPEG, PNG, GIF, WebP
- Try different browser
- Check console for errors

---

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| localStorage | ✓ | ✓ | ✓ | ✓ |
| FileReader | ✓ | ✓ | ✓ | ✓ |
| Geolocation | ✓ | ✓ | ✓ | ✓ |
| Drag & Drop | ✓ | ✓ | ✓ | ✓ |
| CSS Grid | ✓ | ✓ | ✓ | ✓ |

---

## Development Tips

### Clear Storage on Startup

```javascript
// In app.js, during development:
if (localStorage.getItem('clearOnStart')) {
  localStorage.clear();
  localStorage.removeItem('clearOnStart');
}
```

### Generate Test Data

```javascript
// Generate 5 random test issues
const testCategories = ['Road Damage', 'Pothole', 'Street Light'];
for (let i = 0; i < 5; i++) {
  const issue = {
    id: Date.now() + i,
    issue: `Test issue ${i}`,
    category: testCategories[Math.floor(Math.random() * 3)],
    latitude: 40.7 + Math.random() * 0.1,
    longitude: -74 + Math.random() * 0.1,
    createdAt: new Date().toISOString(),
    status: Math.random() > 0.5 ? 'open' : 'resolved',
    imageData: null
  };
  // Save issue...
}
```

### Debug localStorage

```javascript
// Pretty print localStorage
console.table(JSON.parse(localStorage.getItem('issues')));

// Export as JSON file
const issues = JSON.parse(localStorage.getItem('issues'));
const dataStr = JSON.stringify(issues, null, 2);
const dataBlob = new Blob([dataStr], { type: 'application/json' });
const url = URL.createObjectURL(dataBlob);
const link = document.createElement('a');
link.href = url;
link.download = 'issues.json';
link.click();
```

---

## Future Enhancements

### Phase 1: Current (localStorage)
- ✅ Basic form submission
- ✅ Image upload & preview
- ✅ Geolocation support
- ✅ Local data persistence

### Phase 2: Backend Integration
- MongoDB database
- REST API endpoints
- User authentication
- Real-time updates

### Phase 3: Advanced Features
- User accounts & roles
- Issue comments
- Severity ratings
- Admin dashboard
- Email notifications

### Phase 4: Mobile & Scaling
- Mobile app (iOS/Android)
- Caching layer (Redis)
- CDN for images
- Geospatial search optimization

---

## File Size Reference

For estimation purposes:

```
- HTML file:              ~40 KB
- JavaScript (app.js):    ~20 KB
- CSS (inline):           ~15 KB
- Average image (1MB):    ~1.3 MB (base64)
- 10 issues + 10 images:  ~13 MB total
```

---

## Support & Issues

If you encounter issues:

1. **Check browser console** - Press F12 → Console tab
2. **Clear cache** - Ctrl+Shift+Delete
3. **Try incognito mode** - Rules out extensions
4. **Check storage** - See JavaScript snippets above
5. **Verify format** - Ensure images are valid

---

## License

This project is provided as-is for educational purposes.

---

## Summary

- **Frontend**: `index.html` + `app.js` (Ready to use!)
- **Backend**: `issueController.js` + `issueService.js` (Ready when needed)
- **Migration**: Simple swap from localStorage to API calls
- **Scalability**: Designed for easy transition to production database

**Get started now**: Open `index.html` in your browser! 🚀
