# Large Scale Data - India Constituency Level

Guide for handling massive datasets at India's constituency level (~543 constituencies, multiple states).

---

## 📊 Scale Overview

### India Geographic Data
```
Total Constituencies: 543 (Lok Sabha)
Total States: 28
Total Union Territories: 8
Total Cities/Towns: ~4,000+
Potential Issues per Constituency: 100-1,000+
Total Potential Data Points: 50,000 - 500,000+
```

### Current System Limitations
```
localStorage:     ~10MB (too small for scale)
localStorage issues: ~5-20 per browser (not scalable)
Single file upload: 5MB max (too small for bulk)
Memory usage: High for large marker clusters
```

---

## 🗺️ Data Sources for Indian Constituencies

### 1. **Free/Open Sources**

#### Government Data
- **India Census 2021** - census2021.co.in
  - Population by constituency
  - Demographics
  - Infrastructure data

- **Election Commission of India** - eci.gov.in
  - Constituency boundaries
  - Election data
  - Voter information

- **OpenStreetMap (OSM)** - openstreetmap.org
  - Constituency boundaries (GeoJSON)
  - Administrative boundaries
  - Free to use

- **DataMeet India** - datameet.org
  - Constituency GeoJSON data
  - Boundary files
  - Community-maintained

#### APIs
```
1. Google Maps API (Paid, high limits)
2. Mapbox API (Paid, but good for clustering)
3. OpenStreetMap Nominatim (Free, rate-limited)
4. Overpass API (Free, for OSM data)
```

### 2. **Paid Sources** (Best for Production)

| Source | Cost | Data | Use Case |
|--------|------|------|----------|
| **Google Maps Platform** | $0.005-0.02/request | Maps, Geocoding, Places | Enterprise |
| **Mapbox** | $5-50/month | Vector tiles, Analysis | Startups |
| **Here Maps** | $0.002-0.025/query | Routing, Geocoding | Large scale |
| **AWS Location Service** | Pay-per-request | Maps, Geofencing | AWS users |

### 3. **Sample Data Files**

**Constituency GeoJSON:**
```
Download from: https://github.com/datameet/india_electiondata
Files: constituency_boundaries.geojson (all 543 constituencies)
Size: ~50-100MB
Format: GeoJSON with coordinates
```

---

## 🗄️ Database Solutions for Large Scale

### Option 1: PostgreSQL + PostGIS (RECOMMENDED)

**Why:**
- ✅ Best for geospatial data
- ✅ Excellent performance with indexes
- ✅ Free & open-source
- ✅ Handles 1M+ records easily
- ✅ Built-in spatial functions

**Setup:**
```bash
# Install PostgreSQL with PostGIS
# Mac
brew install postgresql postgis

# Windows
# Download from postgresql.org and check PostGIS extension

# Linux
sudo apt-get install postgresql postgis
```

**Create Schema:**
```sql
CREATE EXTENSION postgis;

CREATE TABLE constituencies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  state VARCHAR(100),
  region_geometry GEOMETRY(POLYGON, 4326),
  population INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE issues (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255),
  description TEXT,
  category VARCHAR(100),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  location GEOMETRY(POINT, 4326),
  constituency_id INT REFERENCES constituencies(id),
  image_url VARCHAR(500),
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create spatial index for fast queries
CREATE INDEX idx_location ON issues USING GIST(location);
CREATE INDEX idx_constituency ON issues(constituency_id);
```

**Query Examples:**
```sql
-- Find all issues in a constituency
SELECT * FROM issues 
WHERE ST_Contains(
  (SELECT region_geometry FROM constituencies WHERE name = 'Mumbai South'),
  location
);

-- Find issues within 5km of a point
SELECT * FROM issues 
WHERE ST_DWithin(
  location, 
  ST_MakePoint(72.8479, 19.0760)::geography, 
  5000
);

-- Issues per constituency
SELECT c.name, COUNT(i.id) as issue_count
FROM constituencies c
LEFT JOIN issues i ON ST_Contains(c.region_geometry, i.location)
GROUP BY c.name
ORDER BY issue_count DESC;
```

### Option 2: MongoDB with Geospatial Indexes

**Why:**
- ✅ Document-based (flexible schema)
- ✅ Good for mixed data types
- ✅ Geospatial indexing built-in
- ✅ Easy to scale horizontally

**Setup:**
```bash
npm install mongodb
```

**Schema:**
```javascript
// issues.js
db.issues.createIndex({ "location": "2dsphere" });
db.issues.createIndex({ "constituency": 1 });
db.issues.createIndex({ "status": 1 });
db.issues.createIndex({ "created_at": -1 });

// Insert issue
db.issues.insertOne({
  title: "Pothole",
  category: "Road Damage",
  location: {
    type: "Point",
    coordinates: [78.9629, 20.5937]  // [longitude, latitude]
  },
  constituency: "New Delhi",
  status: "open",
  image: "url/to/image.jpg",
  created_at: new Date()
});

// Query: Find issues within 5km
db.issues.find({
  location: {
    $near: {
      $geometry: {
        type: "Point",
        coordinates: [78.9629, 20.5937]
      },
      $maxDistance: 5000  // meters
    }
  }
});
```

### Option 3: ElasticSearch (For Search + Analytics)

**Why:**
- ✅ Powerful full-text search
- ✅ Built-in analytics
- ✅ Real-time data
- ✅ Excellent for large datasets (100M+ records)

**Setup:**
```bash
# Docker
docker run -d -p 9200:9200 -e "discovery.type=single-node" docker.elastic.co/elasticsearch/elasticsearch:8.0.0
```

---

## 📊 Import Strategy for Large Datasets

### Option 1: Bulk Import from CSV

**Get constituency data:**
```bash
# Download from DataMeet
git clone https://github.com/datameet/india_electiondata.git

# Extract GeoJSON file
# File: constituency_2014.geojson
```

**Create import script:**

```javascript
// import-constituencies.js
const fs = require('fs');
const { MongoClient } = require('mongodb');

const client = new MongoClient('mongodb://localhost:27017');

async function importConstituencies() {
  try {
    const db = client.db('issues-db');
    const collection = db.collection('constituencies');

    // Read GeoJSON file
    const data = JSON.parse(fs.readFileSync('constituency_2014.geojson', 'utf8'));

    // Transform features to documents
    const constituencies = data.features.map((feature, index) => ({
      id: index + 1,
      name: feature.properties.NAME,
      state: feature.properties.STATE,
      geometry: {
        type: "Polygon",
        coordinates: feature.geometry.coordinates
      },
      properties: feature.properties,
      created_at: new Date()
    }));

    // Bulk insert
    const result = await collection.insertMany(constituencies);
    console.log(`Imported ${result.insertedIds.length} constituencies`);

    // Create geospatial index
    await collection.createIndex({ "geometry": "2dsphere" });
    console.log("Created geospatial index");

  } finally {
    await client.close();
  }
}

importConstituencies();
```

**Run import:**
```bash
node import-constituencies.js
```

### Option 2: Seed Issues at Scale

```javascript
// seed-issues.js
const { MongoClient } = require('mongodb');

const client = new MongoClient('mongodb://localhost:27017');

async function seedIssues() {
  const db = client.db('issues-db');
  const collection = db.collection('issues');

  // Get all constituencies
  const constituencies = await db.collection('constituencies').find().toArray();

  const issues = [];

  // Generate 100 random issues per constituency
  constituencies.forEach(constituency => {
    for (let i = 0; i < 100; i++) {
      // Random point within bounds
      const lat = constituency.properties.latitude || 20 + Math.random() * 15;
      const lng = constituency.properties.longitude || 78 + Math.random() * 15;

      issues.push({
        title: `Issue ${Math.random().toString(36).substring(7)}`,
        category: ['Pothole', 'Street Light', 'Drainage', 'Road Damage'][
          Math.floor(Math.random() * 4)
        ],
        location: {
          type: "Point",
          coordinates: [lng + (Math.random() - 0.5) * 0.1, lat + (Math.random() - 0.5) * 0.1]
        },
        constituency: constituency.name,
        state: constituency.state,
        status: ['open', 'in-progress', 'resolved'][Math.floor(Math.random() * 3)],
        created_at: new Date(),
        image_url: null
      });
    }
  });

  // Batch insert
  if (issues.length > 0) {
    const result = await collection.insertMany(issues);
    console.log(`Seeded ${result.insertedIds.length} issues`);
  }

  await client.close();
}

seedIssues();
```

---

## 🚀 Optimization Strategies for Large Scale

### 1. **Database Optimization**

```sql
-- PostgreSQL with PostGIS
-- Create proper indexes
CREATE INDEX idx_issues_location ON issues USING GIST(location);
CREATE INDEX idx_issues_constituency ON issues(constituency_id);
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_issues_created ON issues(created_at DESC);

-- Partition for very large tables (1M+ records)
CREATE TABLE issues_2024_q1 PARTITION OF issues
FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');
```

### 2. **API Optimization**

```javascript
// Pagination for large result sets
app.get('/api/issues', async (req, res) => {
  const page = req.query.page || 1;
  const limit = req.query.limit || 50;  // Max 100
  const skip = (page - 1) * limit;

  // Get total count (cached)
  const total = await db.issues.countDocuments();

  // Get paginated results
  const issues = await db.issues
    .find()
    .skip(skip)
    .limit(limit)
    .lean()  // Don't hydrate full objects
    .exec();

  res.json({
    data: issues,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// Geospatial query with radius
app.get('/api/issues/nearby', async (req, res) => {
  const { lat, lng, radius = 5 } = req.query;

  const issues = await db.issues.find({
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [parseFloat(lng), parseFloat(lat)]
        },
        $maxDistance: radius * 1000
      }
    }
  })
  .limit(100)
  .lean()
  .exec();

  res.json({ data: issues, count: issues.length });
});

// Aggregation pipeline for statistics
app.get('/api/stats/by-constituency', async (req, res) => {
  const stats = await db.issues.aggregate([
    {
      $group: {
        _id: "$constituency",
        total: { $sum: 1 },
        open: { $sum: { $cond: [{ $eq: ["$status", "open"] }, 1, 0] } },
        resolved: { $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] } }
      }
    },
    { $sort: { total: -1 } },
    { $limit: 50 }
  ]).toArray();

  res.json({ data: stats });
});
```

### 3. **Frontend Optimization**

```javascript
// Lazy load map tiles
const osmLayer = L.tileLayer(url, {
  maxNativeZoom: 19,
  maxZoom: 21,
  updateWhenZooming: false
});

// Use clustering for 1000+ markers
const markerClusterGroup = L.markerClusterGroup({
  maxClusterRadius: 80,
  disableClusteringAtZoom: 16,
  chunkedLoading: true  // Load markers in chunks
});

// Load data progressively
let isLoadingMore = false;
let currentPage = 1;

async function loadMoreIssues() {
  if (isLoadingMore) return;
  
  isLoadingMore = true;
  const response = await fetch(`/api/issues?page=${currentPage}&limit=100`);
  const { data, pagination } = await response.json();
  
  data.forEach(issue => mapManager.addMarker(issue));
  
  isLoadingMore = false;
  currentPage++;
  
  if (currentPage > pagination.pages) {
    // All loaded
  }
}

// Load initial page
loadMoreIssues();
```

### 4. **Caching Strategy**

```javascript
const redis = require('redis');
const client = redis.createClient();

// Cache constituency stats for 1 hour
app.get('/api/stats/constituency/:name', async (req, res) => {
  const cacheKey = `stats:${req.params.name}`;
  
  // Check cache
  const cached = await client.get(cacheKey);
  if (cached) {
    return res.json(JSON.parse(cached));
  }
  
  // Fetch from DB
  const stats = await getConstituencyStats(req.params.name);
  
  // Cache for 1 hour
  await client.setex(cacheKey, 3600, JSON.stringify(stats));
  
  res.json(stats);
});
```

---

## 🗺️ Visualization for Large Datasets

### 1. **Heatmap (For Dense Data)**

```javascript
// Using Deck.gl for heatmap
import { HeatmapLayer } from '@deck.gl/layers';

const layer = new HeatmapLayer({
  data: issues,
  getPosition: d => [d.location.coordinates[0], d.location.coordinates[1]],
  getWeight: d => 1,
  radiusPixels: 30,
  colorRange: [
    [0, 0, 255],      // Blue
    [0, 255, 255],    // Cyan
    [0, 255, 0],      // Green
    [255, 255, 0],    // Yellow
    [255, 0, 0]       // Red
  ]
});
```

### 2. **Cluster View (Default)**

Leaflet clustering automatically groups nearby markers:
```javascript
const clusters = L.markerClusterGroup({
  maxClusterRadius: 80,
  disableClusteringAtZoom: 16
});

// Add all markers
issues.forEach(issue => {
  const marker = L.marker([issue.location.coordinates[1], issue.location.coordinates[0]]);
  clusters.addLayer(marker);
});

map.addLayer(clusters);
```

### 3. **Choropleth Map (By Constituency)**

```javascript
// Color constituencies by issue count
async function visualizeByConstituency() {
  const stats = await fetch('/api/stats/by-constituency').then(r => r.json());
  
  const geoJsonLayer = L.geoJson(constituencyBoundaries, {
    style: (feature) => {
      const constituency = feature.properties.NAME;
      const count = stats.find(s => s._id === constituency)?.total || 0;
      const color = count > 100 ? '#d73027' : count > 50 ? '#fee090' : '#1a9850';
      
      return {
        fillColor: color,
        weight: 1,
        opacity: 0.8,
        color: '#333',
        fillOpacity: 0.7
      };
    }
  }).addTo(map);
}
```

---

## 📱 Scalable Architecture

```
┌─────────────────────────────────────────────────┐
│           Client Layer (Browser/App)            │
│  - Leaflet/Deck.gl for visualization            │
│  - Lazy loading, pagination                     │
│  - Clustering for dense data                    │
└────────────────────┬────────────────────────────┘
                     │ HTTP/REST
                     ↓
┌─────────────────────────────────────────────────┐
│          API Layer (Node.js/Express)            │
│  - Pagination (50-100 per page)                 │
│  - Geospatial queries                           │
│  - Redis caching                                │
│  - Load balancing (multiple instances)          │
└────────────────────┬────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ↓            ↓            ↓
    ┌────────┐ ┌─────────┐ ┌──────────┐
    │PostgreSQL│ │ Redis  │ │ File    │
    │+ PostGIS │ │ Cache  │ │ Storage │
    └────────┘ └─────────┘ │ (S3)    │
   (Primary DB)            └──────────┘
   (10M+ records)
```

---

## 🔄 Migration Plan

### Phase 1: Current (sqlite/localStorage)
- ✅ Works for small scale (100-1000 records)
- ✅ No setup needed
- ✅ Good for MVP

### Phase 2: PostgreSQL + PostGIS
```bash
# Setup
docker run -d \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=issues_db \
  -v pgdata:/var/lib/postgresql/data \
  -p 5432:5432 \
  postgis/postgis

# Connect
DATABASE_URL=postgresql://user:password@localhost/issues_db npm start
```

### Phase 3: MongoDB + Aggregation
- Best for time-series data
- Easy to scale horizontally
- Good for analytics

### Phase 4: ElasticSearch + Kibana
- Real-time analytics
- Full-text search
- Beautiful dashboards

---

## 📈 Performance Benchmarks

| Database | Records | Query Time | Cost |
|----------|---------|-----------|------|
| localStorage | 1K | <100ms | Free |
| MongoDB | 100K | 50-200ms | $5-50/mo |
| PostgreSQL + PostGIS | 1M | 100-500ms | Free/AWS |
| ElasticSearch | 10M | 50-100ms | $15-100/mo |

---

## 🛠️ Implementation Steps

### 1. Get Constituency Data

```bash
# Download from DataMeet
git clone https://github.com/datameet/india_electiondata.git
cd india_electiondata
# Extract: constituency_2014.geojson or constituency_2019.geojson
```

### 2. Setup PostgreSQL

```bash
# Install & enable PostGIS
CREATE EXTENSION postgis;

# Create tables (see schema above)
# Load constituency data
```

### 3. Seed Issues

```bash
# Use seed script to generate test data
node scripts/seed-issues.js --constituencies 543 --issues-per-constituency 100
```

### 4. Update API

```javascript
// Use SQL/aggregation for statistics
// Implement pagination
// Add geospatial queries
// Add caching
```

### 5. Update Frontend

```javascript
// Implement lazy loading
// Add clustering
// Add heatmap view
// Add constituency-based filtering
```

---

## 💡 Best Practices for Large Scale

✅ **Database**
- Index every field used in WHERE clauses
- Use partitioning for 1M+ records
- Regular maintenance & vacuuming

✅ **API**
- Implement pagination (50-100 per page)
- Use aggregation pipelines, not application-level sorting
- Cache frequently accessed data
- Implement rate limiting

✅ **Frontend**
- Cluster markers at zoom < 16
- Lazy load tiles and images
- Progressive data loading
- Implement infinite scroll

✅ **Infrastructure**
- Use load balancer (nginx, HAProxy)
- Multiple API instances
- Read replicas for database
- CDN for static assets

---

## 🎯 Summary

**For India Constituency Level Data:**

1. **Data Source:** Use DataMeet India GeoJSON (free)
2. **Database:** PostgreSQL + PostGIS (best for geospatial)
3. **Scale:** Can handle 500K+ issues easily
4. **Cost:** $0-50/month (PostgreSQL + basic server)
5. **Performance:** Sub-100ms queries with proper indexing

**Next Steps:**
1. Download constituency boundaries
2. Setup PostgreSQL + PostGIS
3. Seed with 100-1000 test issues per constituency
4. Update API for geospatial queries
5. Update frontend for clustering/heatmap

---

This approach will scale from 100 issues to 1M+ without changes to architecture.
