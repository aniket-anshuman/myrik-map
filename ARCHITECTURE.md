# Issue Reporting API - Architecture Overview

## Project Structure

```
issue-reporting-api/
├── app.js                          # Express app setup & middleware
├── issueController.js              # Route handlers (endpoints)
├── issueService.js                 # Business logic layer
├── issueModels.js                  # Data models & DTOs
├── package.json                    # Dependencies
├── .env.example                    # Environment variables template
├── uploads/
│   └── issues/                     # Uploaded images directory
├── tests/
│   └── issues.test.js             # Jest test suite
├── API_DOCUMENTATION.md            # API reference
├── TESTING_GUIDE.md               # Testing instructions
└── ARCHITECTURE.md                 # This file
```

---

## Layers Architecture

```
┌─────────────────────────────────────────┐
│         HTTP Request/Response           │
├─────────────────────────────────────────┤
│     Controller Layer (issueController)  │ ← Route handling, validation
├─────────────────────────────────────────┤
│      Service Layer (issueService)       │ ← Business logic
├─────────────────────────────────────────┤
│       Data Layer (Database)             │ ← Persistence
├─────────────────────────────────────────┤
│       File Storage (Multer)             │ ← Image uploads
└─────────────────────────────────────────┘
```

---

## Component Descriptions

### 1. Express Server (app.js)
- **Responsibility:** Initialize and configure Express server
- **Features:**
  - Middleware setup (JSON parser, static files)
  - Route registration
  - Error handling
  - CORS configuration (future)

### 2. Controller Layer (issueController.js)
- **Responsibility:** Handle HTTP requests and responses
- **Features:**
  - Route definitions (`/api/issues/*`)
  - Request validation
  - File upload handling (multer)
  - Response formatting
  - Error handling

**Endpoints:**
```
POST   /api/issues                      Create issue
GET    /api/issues                      List issues
GET    /api/issues/:id                  Get single issue
GET    /api/issues-count/total          Total count
GET    /api/issues-count/category/:cat  Count by category
GET    /api/issues-count/status/:stat   Count by status
GET    /api/issues-stats                Statistics
```

### 3. Service Layer (issueService.js)
- **Responsibility:** Business logic and data manipulation
- **Methods:**
  - `createIssue()` - Create new issue
  - `getIssues()` - Retrieve with filters
  - `getIssueById()` - Get single issue
  - `getTotalCount()` - Count all issues
  - `getCountByCategory()` - Count by category
  - `getCountByStatus()` - Count by status
  - `getStatistics()` - Aggregate statistics
  - `updateIssueStatus()` - Update status
  - `deleteIssue()` - Delete issue
  - `searchIssues()` - Text search
  - `getIssuesNearLocation()` - Geospatial query

### 4. Models (issueModels.js)
- **Responsibility:** Data structure definitions
- **Classes:**
  - `Issue` - Main data model
  - `CreateIssueRequest` - DTO for POST requests
  - `ApiResponse` - Standard response wrapper
  - `ErrorResponse` - Error wrapper
  - `IssueFilterQuery` - Filter parameters
  - `IssueStatistics` - Statistics object

### 5. File Upload Handler (Multer)
- **Responsibility:** Handle image uploads
- **Configuration:**
  - Storage: Disk storage with unique naming
  - File filter: Images only (JPEG, PNG, GIF, WebP)
  - Size limit: 5 MB
  - Destination: `./uploads/issues/`

---

## Data Flow

### Create Issue Flow
```
1. Client sends POST /api/issues
   ↓
2. Multer middleware processes file upload
   ↓
3. Controller validates request data
   ↓
4. Controller extracts file path and data
   ↓
5. Service layer creates Issue object
   ↓
6. Database stores issue record
   ↓
7. Response returned to client
```

### Get Issues Flow
```
1. Client sends GET /api/issues?filters
   ↓
2. Controller extracts query parameters
   ↓
3. Service builds database query
   ↓
4. Database returns filtered results
   ↓
5. Service formats response
   ↓
6. Controller returns JSON response
```

---

## Error Handling Strategy

```
┌──────────────────────┐
│   Request Received   │
└──────────┬───────────┘
           │
     ┌─────▼─────┐
     │ Validation │──────────► 400 Bad Request
     └─────┬─────┘
           │ ✓
     ┌─────▼────────────┐
     │ File Processing  │──────────► 413 Payload Too Large
     └─────┬────────────┘
           │ ✓
     ┌─────▼──────────┐
     │ Business Logic │──────────► 500 Server Error
     └─────┬──────────┘
           │ ✓
     ┌─────▼────────┐
     │ Response OK  │──────────► 200/201 Success
     └──────────────┘
```

---

## Database Schema (MongoDB)

### Collections

```javascript
db.issues {
  _id: ObjectId,
  id: String,
  issue: String,
  category: String,
  latitude: Number,
  longitude: Number,
  imageUrl: String,
  imageOriginalName: String,
  createdAt: Date,
  updatedAt: Date,
  status: String,
  location: {                    // For geospatial queries
    type: "Point",
    coordinates: [longitude, latitude]
  }
}
```

### Indexes

```javascript
// Category lookup
db.issues.createIndex({ category: 1 })

// Status lookup
db.issues.createIndex({ status: 1 })

// Recent issues
db.issues.createIndex({ createdAt: -1 })

// Geospatial queries
db.issues.createIndex({ location: "2dsphere" })

// Compound index for common queries
db.issues.createIndex({ category: 1, status: 1, createdAt: -1 })
```

---

## File Structure & Naming Conventions

### Controllers
- Pattern: `*Controller.js` or `*Router.js`
- Example: `issueController.js`

### Services
- Pattern: `*Service.js`
- Example: `issueService.js`

### Models/DTOs
- Pattern: `*Models.js` or `*DTO.js`
- Example: `issueModels.js`

### Routes
- Pattern: `/api/[resource]/[action]`
- RESTful endpoints with proper HTTP methods

### File Uploads
- Naming: `fieldname-timestamp-random.ext`
- Example: `image-1682607849230-123456.jpg`

---

## Response Format Standard

All responses follow this structure:

```json
{
  "success": boolean,
  "message": "string (optional)",
  "data": object|array (optional),
  "count": number (optional),
  "error": "string (optional, dev only)"
}
```

---

## Status Lifecycle

```
┌─────┐     work done      ┌──────────────┐
│open │─────────────────────► in-progress │
└─────┘                      └──────┬──────┘
  ▲                                 │
  │ (reopen)                        │
  │                              (fix)
  │                                 │
  │                          ┌──────▼────────┐
  │                          │ resolved      │
  │                          └──────┬────────┘
  │                                 │
  │                               (close)
  │                                 │
  │                          ┌──────▼────┐
  └──────────────────────────┤ closed    │
                             └───────────┘
```

---

## Security Considerations

### Current Implementation
- ✓ File type validation
- ✓ File size limits
- ✓ Input validation

### Recommended Additions
- [ ] CORS whitelist
- [ ] Rate limiting
- [ ] Input sanitization
- [ ] JWT authentication
- [ ] API key validation
- [ ] Request signing
- [ ] SQL injection prevention (if using SQL)
- [ ] XSS protection
- [ ] HTTPS enforcement

---

## Performance Optimization

### Database Queries
- **Index all frequently filtered fields:** category, status, createdAt
- **Geospatial index:** For location-based queries
- **Pagination:** Implement limit/offset for list endpoints

### File Uploads
- **Async processing:** Handle image compression in background
- **CDN integration:** Serve images from CDN in production
- **Image optimization:** Resize and compress on upload

### Caching
- **Redis cache:** Cache frequently accessed statistics
- **ETag headers:** For GET requests
- **Compression:** gzip compression for responses

### Monitoring
- **Logs:** Structured logging (Winston, Pino)
- **Metrics:** Request count, latency, error rates
- **APM:** Application performance monitoring

---

## Deployment Architecture

```
┌─────────────────────────────────────────┐
│         Client Application              │
│      (Web/Mobile/Desktop)               │
└────────────────┬────────────────────────┘
                 │
        ┌────────▼────────┐
        │   API Gateway   │
        │  (Rate limit)   │
        └────────┬────────┘
                 │
        ┌────────▼────────────────────┐
        │   Load Balancer (Nginx)     │
        └────────┬────────────────────┘
                 │
    ┌────────────┼────────────────┐
    │            │                │
┌───▼──┐    ┌───▼──┐        ┌───▼──┐
│Node  │    │Node  │   ...  │Node  │
│App 1 │    │App 2 │        │App N │
└───┬──┘    └───┬──┘        └───┬──┘
    │           │                │
    └───────────┼────────────────┘
                │
        ┌───────▼───────┐
        │   MongoDB     │
        │  Replicaset   │
        └───────┬───────┘
                │
        ┌───────▼───────────┐
        │  File Storage     │
        │  (S3/GCS/Local)   │
        └───────────────────┘
```

---

## Environment Setup

### Development
```bash
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/issues-db
UPLOAD_DIR=./uploads/issues
```

### Production
```bash
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/issues-db
UPLOAD_DIR=/var/uploads/issues
```

---

## Testing Strategy

### Unit Tests
- Service layer logic
- Validation functions
- Utility functions

### Integration Tests
- Controller & Service interaction
- Database operations
- File upload handling

### End-to-End Tests
- Complete workflows
- API endpoints
- Error scenarios

---

## Future Enhancements

1. **Authentication & Authorization**
   - JWT tokens
   - Role-based access control
   - User profiles

2. **Advanced Features**
   - Comments on issues
   - Severity ratings
   - Status updates
   - Notifications

3. **Analytics**
   - Issue heatmaps
   - Trend analysis
   - Performance metrics

4. **Scalability**
   - Microservices architecture
   - Message queues
   - Cache layer (Redis)
   - Search engine (Elasticsearch)

5. **Mobile App**
   - Native iOS/Android
   - Offline support
   - Push notifications

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 18+ |
| Framework | Express.js |
| Database | MongoDB |
| File Storage | Multer (Disk) |
| Authentication | JWT (future) |
| Testing | Jest, Supertest |
| Deployment | Docker, Kubernetes (future) |
| Monitoring | Winston, Prometheus (future) |

---

## Key Design Patterns

1. **MVC Pattern:** Models, Views (JSON), Controllers
2. **Service Layer Pattern:** Separation of concerns
3. **DTO Pattern:** Data transfer objects for requests/responses
4. **Repository Pattern:** Abstract data access (future)
5. **Middleware Pattern:** Express middleware stack

---

## Contributing

When extending this API:

1. Follow the existing layer structure
2. Add DTOs for new request types
3. Add service methods for business logic
4. Add comprehensive error handling
5. Write tests for new features
6. Update documentation

---

## Support & Documentation

- **API Docs:** See `API_DOCUMENTATION.md`
- **Testing:** See `TESTING_GUIDE.md`
- **Setup:** See `README.md` (create if needed)
