# API Testing Guide

## Testing the Issue Reporting API

### Prerequisites
- Node.js installed
- Server running on `http://localhost:3000`
- Test image file available

---

## Using cURL

### 1. Create Issue with Image

```bash
# Basic request
curl -X POST http://localhost:3000/api/issues \
  -F "issue=Pothole on Main Street" \
  -F "category=Road Damage" \
  -F "latitude=40.7128" \
  -F "longitude=-74.0060" \
  -F "image=@test-image.jpg"
```

**Response:**
```json
{
  "success": true,
  "message": "Issue created successfully",
  "data": {
    "id": "1gb2dkpq4x",
    "issue": "Pothole on Main Street",
    "category": "Road Damage",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "imageUrl": "/uploads/issues/image-1682607849230-123456.jpg",
    "imageOriginalName": "test-image.jpg",
    "createdAt": "2026-04-27T10:30:00.000Z",
    "status": "open"
  }
}
```

### 2. Get All Issues

```bash
curl http://localhost:3000/api/issues
```

### 3. Get Issues by Category

```bash
curl "http://localhost:3000/api/issues?category=Road%20Damage"
```

### 4. Get Issues Near Location (5km radius)

```bash
curl "http://localhost:3000/api/issues?latitude=40.7128&longitude=-74.0060&radius=5"
```

### 5. Get Issue by ID

```bash
curl http://localhost:3000/api/issues/1gb2dkpq4x
```

### 6. Get Total Count

```bash
curl http://localhost:3000/api/issues-count/total
```

### 7. Get Count by Category

```bash
curl http://localhost:3000/api/issues-count/category/Road%20Damage
```

### 8. Get Count by Status

```bash
curl http://localhost:3000/api/issues-count/status/open
```

### 9. Get Statistics

```bash
curl http://localhost:3000/api/issues-stats
```

---

## Using Postman

### 1. Create Collection
- Create new collection: "Issue Reporting API"

### 2. POST Request - Create Issue

**URL:** `http://localhost:3000/api/issues`

**Headers:**
```
(Leave Content-Type blank - Postman will set it automatically for multipart)
```

**Body (form-data):**
| Key | Type | Value |
|-----|------|-------|
| issue | text | Large pothole in the middle of the road |
| category | text | Road Damage |
| latitude | text | 40.7128 |
| longitude | text | -74.0060 |
| image | file | (select your image file) |

### 3. GET Request - All Issues

**URL:** `http://localhost:3000/api/issues`

**Params:**
| Key | Value |
|-----|-------|
| category | Road Damage |
| latitude | 40.7128 |
| longitude | -74.0060 |
| radius | 5 |

### 4. GET Request - Single Issue

**URL:** `http://localhost:3000/api/issues/{{issue_id}}`

### 5. GET Request - Statistics

**URL:** `http://localhost:3000/api/issues-stats`

---

## Using JavaScript/Node.js

### Using Fetch API (Browser/Node 18+)

```javascript
// Create issue with FormData
const formData = new FormData();
formData.append('issue', 'Pothole on Main Street');
formData.append('category', 'Road Damage');
formData.append('latitude', '40.7128');
formData.append('longitude', '-74.0060');
formData.append('image', fileInput.files[0]); // From <input type="file">

const response = await fetch('http://localhost:3000/api/issues', {
  method: 'POST',
  body: formData
});

const data = await response.json();
console.log(data);
```

### Using axios

```javascript
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const createIssue = async () => {
  const form = new FormData();
  form.append('issue', 'Pothole on Main Street');
  form.append('category', 'Road Damage');
  form.append('latitude', '40.7128');
  form.append('longitude', '-74.0060');
  form.append('image', fs.createReadStream('test-image.jpg'));

  try {
    const response = await axios.post(
      'http://localhost:3000/api/issues',
      form,
      { headers: form.getHeaders() }
    );
    console.log('Issue created:', response.data);
  } catch (error) {
    console.error('Error:', error.response.data);
  }
};

createIssue();
```

### Get All Issues

```javascript
const getIssues = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/issues');
    const data = await response.json();
    console.log('Issues:', data);
  } catch (error) {
    console.error('Error:', error);
  }
};

getIssues();
```

### Get Statistics

```javascript
const getStats = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/issues-stats');
    const stats = await response.json();
    console.log('Statistics:', stats.data);
  } catch (error) {
    console.error('Error:', error);
  }
};

getStats();
```

---

## Using pytest (Python)

```python
import requests
from pathlib import Path

BASE_URL = 'http://localhost:3000/api'

# Create issue
def test_create_issue():
    with open('test-image.jpg', 'rb') as img:
        files = {'image': img}
        data = {
            'issue': 'Pothole on Main Street',
            'category': 'Road Damage',
            'latitude': 40.7128,
            'longitude': -74.0060
        }
        response = requests.post(f'{BASE_URL}/issues', files=files, data=data)
        print(response.json())
        return response.json()['data']['id']

# Get all issues
def test_get_issues():
    response = requests.get(f'{BASE_URL}/issues')
    print(response.json())

# Get issue by ID
def test_get_issue_by_id(issue_id):
    response = requests.get(f'{BASE_URL}/issues/{issue_id}')
    print(response.json())

# Get statistics
def test_get_stats():
    response = requests.get(f'{BASE_URL}/issues-stats')
    print(response.json())

if __name__ == '__main__':
    issue_id = test_create_issue()
    test_get_issues()
    test_get_issue_by_id(issue_id)
    test_get_stats()
```

---

## Error Testing

### Missing Required Fields

```bash
curl -X POST http://localhost:3000/api/issues \
  -F "issue=Test" \
  -F "category=Road Damage"
```

**Response (400):**
```json
{
  "success": false,
  "message": "Missing required fields: issue, category, latitude, longitude"
}
```

### Invalid File Type

```bash
curl -X POST http://localhost:3000/api/issues \
  -F "issue=Test" \
  -F "category=Road Damage" \
  -F "latitude=40.7128" \
  -F "longitude=-74.0060" \
  -F "image=@document.pdf"
```

**Response (400):**
```json
{
  "success": false,
  "message": "Only image files are allowed"
}
```

### File Too Large

```bash
# File > 5MB
curl -X POST http://localhost:3000/api/issues \
  -F "image=@large-file.jpg"
```

**Response (413):**
```json
{
  "success": false,
  "message": "File too large. Maximum 5MB allowed."
}
```

### Invalid Coordinates

```bash
curl -X POST http://localhost:3000/api/issues \
  -F "issue=Test" \
  -F "category=Road Damage" \
  -F "latitude=100" \
  -F "longitude=-74.0060" \
  -F "image=@test.jpg"
```

**Response (400):**
```json
{
  "success": false,
  "message": "Invalid latitude or longitude"
}
```

---

## Performance Testing

### Load Testing with Apache Bench

```bash
# Simple GET request load test (100 requests, 10 concurrent)
ab -n 100 -c 10 http://localhost:3000/api/issues-count/total
```

### Load Testing with wrk

```bash
# Download wrk from: https://github.com/wg/wrk
wrk -t12 -c400 -d30s http://localhost:3000/api/issues
```

---

## Test Data Generator (JavaScript)

```javascript
const axios = require('axios');
const fs = require('fs');

const categories = ['Road Damage', 'Pothole', 'Street Light', 'Sidewalk Issue'];

async function generateTestData(count = 10) {
  for (let i = 0; i < count; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const lat = 40.7128 + (Math.random() - 0.5) * 0.1;
    const lng = -74.0060 + (Math.random() - 0.5) * 0.1;

    const form = new (require('form-data'))();
    form.append('issue', `Test issue ${i + 1}`);
    form.append('category', category);
    form.append('latitude', lat);
    form.append('longitude', lng);
    form.append('image', fs.createReadStream('test-image.jpg'));

    try {
      const response = await axios.post(
        'http://localhost:3000/api/issues',
        form,
        { headers: form.getHeaders() }
      );
      console.log(`Created issue ${i + 1}:`, response.data.data.id);
    } catch (error) {
      console.error(`Failed to create issue ${i + 1}:`, error.message);
    }
  }
}

generateTestData(10);
```

---

## Automated Testing with Jest

```javascript
// test/issues.test.js
const request = require('supertest');
const app = require('../app');
const fs = require('fs');

describe('Issue API', () => {
  test('should create issue with image', async () => {
    const response = await request(app)
      .post('/api/issues')
      .field('issue', 'Test issue')
      .field('category', 'Road Damage')
      .field('latitude', '40.7128')
      .field('longitude', '-74.0060')
      .attach('image', 'test-image.jpg');

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBeDefined();
  });

  test('should get all issues', async () => {
    const response = await request(app).get('/api/issues');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test('should get issue statistics', async () => {
    const response = await request(app).get('/api/issues-stats');
    expect(response.status).toBe(200);
    expect(response.body.data.totalIssues).toBeDefined();
  });
});
```

Run with: `npm test`

---

## Continuous Integration

### GitHub Actions Example

```yaml
name: API Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      mongodb:
        image: mongo
        options: >-
          --health-cmd mongosh
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 27017:27017

    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
```

---

## Debugging

### Enable Verbose Logging

```bash
DEBUG=* npm start
```

### Check Server Health

```bash
curl http://localhost:3000/health
```

### View Upload Logs

```bash
tail -f ./uploads/issues/
```

---

## Conclusion

Test all endpoints thoroughly before deployment to ensure reliability and data integrity.
