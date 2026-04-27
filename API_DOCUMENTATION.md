# Issue Reporting REST API Documentation

## Overview
Location-based issue reporting system API with image upload support. Users can report issues (potholes, street lights, etc.) at specific coordinates along with supporting images.

---

## Base URL
```
http://localhost:3000/api
```

---

## Endpoints

### 1. Create Issue (POST)
**Endpoint:** `POST /api/issues`

**Description:** Create a new issue report with an image attachment

**Request Headers:**
```
Content-Type: multipart/form-data
```

**Request Body:**
```
- issue (string, required): Description of the issue
- category (string, required): Category of issue
- latitude (number, required): Latitude coordinate (-90 to 90)
- longitude (number, required): Longitude coordinate (-180 to 180)
- image (file, required): Image file (JPEG, PNG, GIF, WebP, max 5MB)
```

**Example cURL:**
```bash
curl -X POST http://localhost:3000/api/issues \
  -F "issue=Large pothole in the middle of the road" \
  -F "category=Road Damage" \
  -F "latitude=40.7128" \
  -F "longitude=-74.0060" \
  -F "image=@/path/to/image.jpg"
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Issue created successfully",
  "data": {
    "id": "abc123def456",
    "issue": "Large pothole in the middle of the road",
    "category": "Road Damage",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "imageUrl": "/uploads/issues/image-1234567890.jpg",
    "imageOriginalName": "image.jpg",
    "createdAt": "2026-04-27T10:30:00.000Z",
    "status": "open"
  }
}
```

**Error Response (400/413):**
```json
{
  "success": false,
  "message": "Missing required fields: issue, category, latitude, longitude"
}
```

---

### 2. Get All Issues (GET)
**Endpoint:** `GET /api/issues`

**Description:** Retrieve all issues with optional filtering

**Query Parameters:**
```
- category (string, optional): Filter by category
- latitude (number, optional): Center latitude for radius search
- longitude (number, optional): Center longitude for radius search
- radius (number, optional): Radius in kilometers (requires latitude & longitude)
```

**Example Requests:**
```bash
# Get all issues
curl http://localhost:3000/api/issues

# Filter by category
curl http://localhost:3000/api/issues?category=Road%20Damage

# Get issues within 5km of coordinates
curl http://localhost:3000/api/issues?latitude=40.7128&longitude=-74.0060&radius=5
```

**Success Response (200):**
```json
{
  "success": true,
  "count": 42,
  "data": [
    {
      "id": "abc123def456",
      "issue": "Pothole on Main Street",
      "category": "Road Damage",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "imageUrl": "/uploads/issues/image1.jpg",
      "createdAt": "2026-04-27T10:30:00.000Z",
      "status": "open"
    }
  ]
}
```

---

### 3. Get Issue by ID (GET)
**Endpoint:** `GET /api/issues/:id`

**Description:** Retrieve a specific issue by ID

**Path Parameters:**
```
- id (string, required): Issue ID
```

**Example:**
```bash
curl http://localhost:3000/api/issues/abc123def456
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "abc123def456",
    "issue": "Pothole on Main Street",
    "category": "Road Damage",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "imageUrl": "/uploads/issues/image1.jpg",
    "createdAt": "2026-04-27T10:30:00.000Z",
    "status": "open"
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Issue not found"
}
```

---

### 4. Get Total Issue Count (GET)
**Endpoint:** `GET /api/issues-count/total`

**Description:** Get the total count of all issues

**Example:**
```bash
curl http://localhost:3000/api/issues-count/total
```

**Response (200):**
```json
{
  "success": true,
  "count": 42
}
```

---

### 5. Get Count by Category (GET)
**Endpoint:** `GET /api/issues-count/category/:category`

**Description:** Get count of issues in a specific category

**Path Parameters:**
```
- category (string, required): Category name
```

**Example:**
```bash
curl http://localhost:3000/api/issues-count/category/Road%20Damage
```

**Response (200):**
```json
{
  "success": true,
  "category": "Road Damage",
  "count": 15
}
```

---

### 6. Get Count by Status (GET)
**Endpoint:** `GET /api/issues-count/status/:status`

**Description:** Get count of issues in a specific status

**Path Parameters:**
```
- status (string, required): Status (open, in-progress, resolved, closed)
```

**Example:**
```bash
curl http://localhost:3000/api/issues-count/status/open
```

**Response (200):**
```json
{
  "success": true,
  "status": "open",
  "count": 25
}
```

---

### 7. Get Statistics (GET)
**Endpoint:** `GET /api/issues-stats`

**Description:** Get comprehensive statistics about all issues

**Example:**
```bash
curl http://localhost:3000/api/issues-stats
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalIssues": 42,
    "categories": {
      "Road Damage": 15,
      "Pothole": 12,
      "Street Light": 8,
      "Other": 7
    },
    "byStatus": {
      "open": 25,
      "in-progress": 10,
      "resolved": 7
    },
    "generatedAt": "2026-04-27T10:30:00.000Z"
  }
}
```

---

## Request/Response Models

### Issue Object
```json
{
  "id": "abc123def456",
  "issue": "Description of the issue",
  "category": "Category name",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "imageUrl": "/uploads/issues/image.jpg",
  "createdAt": "2026-04-27T10:30:00.000Z",
  "updatedAt": "2026-04-27T10:30:00.000Z",
  "status": "open"
}
```

### Standard Response Wrapper
```json
{
  "success": true/false,
  "message": "Optional message",
  "data": {},
  "count": 0,
  "error": "Optional error details"
}
```

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Issue created successfully |
| 400 | Bad Request - Invalid input |
| 404 | Not Found - Resource not found |
| 413 | Payload Too Large - File exceeds 5MB |
| 500 | Internal Server Error - Server error |

---

## File Upload Details

**Supported Formats:** JPEG, PNG, GIF, WebP
**Max File Size:** 5 MB
**Upload Directory:** `./uploads/issues/`
**File Naming:** `fieldname-timestamp-random.ext`

---

## Categories (Suggested)

- Road Damage
- Pothole
- Street Light
- Sidewalk Issue
- Traffic Sign
- Drainage Issue
- Vegetation Issue
- Other

---

## Status Transitions

```
open → in-progress → resolved → closed
```

---

## Database Schema (MongoDB)

```javascript
db.issues.createIndex({ "latitude": 1, "longitude": 1 })
db.issues.createIndex({ "category": 1 })
db.issues.createIndex({ "status": 1 })
db.issues.createIndex({ "createdAt": -1 })
db.issues.createIndex({ location: "2dsphere" }) // For geospatial queries
```

---

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Create Upload Directory
```bash
mkdir -p uploads/issues
```

### 3. Configure Environment (optional .env)
```
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/issues-db
```

### 4. Start Server
```bash
npm start
# or for development with auto-reload
npm run dev
```

### 5. Test API
```bash
curl http://localhost:3000/health
```

---

## Future Enhancements

1. **Authentication:** Add JWT authentication
2. **Pagination:** Implement limit/offset for GET endpoints
3. **Sorting:** Add sorting options for issues
4. **Advanced Search:** Full-text search capability
5. **Comments:** Add comments/updates to issues
6. **Ratings:** Allow users to rate issue severity
7. **Notifications:** Push notifications when issues are resolved
8. **Analytics:** Heatmaps of issue locations
9. **Batch Operations:** Bulk create/update issues
10. **API Versioning:** v1, v2 endpoints

---

## Error Handling

All errors follow a standard format:

```json
{
  "success": false,
  "message": "User-friendly error message",
  "error": "Technical error details (development only)"
}
```

---

## Rate Limiting (Future)

```
- 100 requests per 15 minutes per IP
- 1000 requests per hour per authenticated user
```

---

## CORS Headers (Future)

Configure CORS for frontend applications:

```javascript
const cors = require('cors');
app.use(cors({
  origin: ['https://yourdomain.com', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
```

---

## Example: Complete Workflow

```bash
# 1. Create an issue
curl -X POST http://localhost:3000/api/issues \
  -F "issue=Broken sidewalk" \
  -F "category=Sidewalk Issue" \
  -F "latitude=40.7128" \
  -F "longitude=-74.0060" \
  -F "image=@photo.jpg"

# Response contains ID: "abc123def456"

# 2. Retrieve the issue
curl http://localhost:3000/api/issues/abc123def456

# 3. Get all issues of same category
curl "http://localhost:3000/api/issues?category=Sidewalk%20Issue"

# 4. Get count of this category
curl http://localhost:3000/api/issues-count/category/Sidewalk%20Issue

# 5. Get statistics
curl http://localhost:3000/api/issues-stats
```

---

## Support
For issues or questions, contact the development team.
