# Display Map Based on Indian Constituencies

Complete guide to show constituency boundaries with data visualization and statistics.

---

## 🎯 Overview

Instead of just showing individual markers, display:
- ✅ Constituency boundaries (polygon shapes)
- ✅ Color-coded by issue count
- ✅ Statistics when hovering
- ✅ Click to see details
- ✅ Filter and drill down

---

## 1️⃣ Get Constituency GeoJSON Data

### Download Constituency Boundaries

```bash
# Option A: From DataMeet (Recommended)
git clone https://github.com/datameet/india_electiondata.git
cd india_electiondata
# File: data/constituencies/constituency_2019.geojson (or 2014)

# Option B: Direct Download
wget https://raw.githubusercontent.com/datameet/india_electiondata/master/data/constituencies/constituency_2019.geojson

# Option C: Alternative Source
# https://github.com/datameet/states/blob/master/TECHNICAL_NOTES.md
```

**File Details:**
```
Size: ~50MB
Format: GeoJSON
Records: 543 constituencies
Fields: NAME, STATE, REGION, YEAR, PC_CODE
Geometry: Polygon (detailed boundary)
```

---

## 2️⃣ Load GeoJSON in Frontend

### Simple Method: Load from File

```javascript
// map-constituency.js
class ConstituencyMapManager {
  constructor(containerId) {
    // Initialize map centered on India
    this.map = L.map(containerId).setView([20.5937, 78.9629], 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    this.constituencies = {};
    this.geoJsonLayer = null;
  }

  // Load GeoJSON file
  async loadConstituencies(geojsonPath) {
    console.log('Loading constituencies...');

    const response = await fetch(geojsonPath);
    const geojson = await response.json();

    // Store for reference
    geojson.features.forEach(feature => {
      const name = feature.properties.NAME;
      this.constituencies[name] = feature;
    });

    console.log(`Loaded ${Object.keys(this.constituencies).length} constituencies`);

    return geojson;
  }

  // Display GeoJSON on map
  displayConstituencies(geojson, dataStats = {}) {
    this.geoJsonLayer = L.geoJson(geojson, {
      style: (feature) => this.getFeatureStyle(feature, dataStats),
      onEachFeature: (feature, layer) => this.onEachFeature(feature, layer, dataStats)
    }).addTo(this.map);
  }

  // Style each constituency based on data
  getFeatureStyle(feature, dataStats) {
    const name = feature.properties.NAME;
    const count = dataStats[name] || 0;

    // Color intensity based on issue count
    let color;
    if (count > 500) color = '#d73027';       // Dark red
    else if (count > 300) color = '#fc8d59';  // Orange
    else if (count > 100) color = '#fee090';  // Light yellow
    else if (count > 0) color = '#91bfdb';    // Light blue
    else color = '#e0e0e0';                   // Grey (no data)

    return {
      fillColor: color,
      weight: 1,
      opacity: 1,
      color: '#333',
      dashArray: '3',
      fillOpacity: 0.7
    };
  }

  // Handle hover and click
  onEachFeature(feature, layer, dataStats) {
    const name = feature.properties.NAME;
    const state = feature.properties.STATE;
    const count = dataStats[name] || 0;

    // Create popup
    const popupContent = `
      <div style="font-size: 12px;">
        <h4 style="margin: 0 0 8px 0;">${name}</h4>
        <p><strong>State:</strong> ${state}</p>
        <p><strong>Issues:</strong> ${count}</p>
        <p><strong>Click for details</strong></p>
      </div>
    `;

    layer.bindPopup(popupContent);

    // Hover effect
    layer.on('mouseover', () => {
      layer.setStyle({
        weight: 3,
        color: '#0066cc',
        fillOpacity: 0.9
      });
      layer.bringToFront();
    });

    layer.on('mouseout', () => {
      this.geoJsonLayer.resetStyle(layer);
    });

    // Click event
    layer.on('click', () => {
      this.onConstituencyClick(name, count);
    });
  }

  // Handle constituency click
  onConstituencyClick(constituencyName, issueCount) {
    console.log(`Clicked: ${constituencyName} (${issueCount} issues)`);
    
    // Fire event for parent app
    window.dispatchEvent(
      new CustomEvent('constituencySelected', {
        detail: { name: constituencyName, count: issueCount }
      })
    );

    // Fit bounds of this constituency
    const feature = this.constituencies[constituencyName];
    if (feature) {
      const bounds = this.getBounds(feature.geometry.coordinates[0]);
      this.map.fitBounds(bounds);
    }
  }

  // Calculate bounds from polygon
  getBounds(coordinates) {
    let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;

    coordinates.forEach(([lng, lat]) => {
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
    });

    return [[minLat, minLng], [maxLat, maxLng]];
  }
}
```

---

## 3️⃣ Calculate Statistics by Constituency

### From MongoDB

```javascript
// Get issues count by constituency
async function getConstituencyStats() {
  const stats = await db.issues.aggregate([
    {
      $group: {
        _id: "$constituency",
        total: { $sum: 1 },
        open: { $sum: { $cond: [{ $eq: ["$status", "open"] }, 1, 0] } },
        resolved: { $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] } }
      }
    }
  ]).toArray();

  // Convert to object for easy lookup
  const statsObj = {};
  stats.forEach(stat => {
    statsObj[stat._id] = stat.total;
  });

  return statsObj;
}
```

### From Frontend (localStorage)

```javascript
// Calculate stats from localStorage
function getConstituencyStats(issues) {
  const stats = {};

  issues.forEach(issue => {
    const constituency = issue.constituency || 'Unknown';
    stats[constituency] = (stats[constituency] || 0) + 1;
  });

  return stats;
}
```

---

## 4️⃣ Integrate into App

### HTML

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    #map { height: 700px; }
    .constituency-info {
      position: absolute;
      top: 10px;
      right: 10px;
      background: white;
      padding: 15px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      max-width: 300px;
      z-index: 100;
    }
    .legend {
      position: absolute;
      bottom: 10px;
      right: 10px;
      background: white;
      padding: 15px;
      border-radius: 8px;
      font-size: 12px;
      z-index: 100;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  
  <div class="legend">
    <h4>Issue Count</h4>
    <div><span style="color: #d73027;">■</span> > 500</div>
    <div><span style="color: #fc8d59;">■</span> 300-500</div>
    <div><span style="color: #fee090;">■</span> 100-300</div>
    <div><span style="color: #91bfdb;">■</span> 1-100</div>
    <div><span style="color: #e0e0e0;">■</span> 0</div>
  </div>

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script src="map-constituency.js"></script>
  <script src="app.js"></script>
</body>
</html>
```

### JavaScript (app.js)

```javascript
class IssueReportingApp {
  constructor() {
    this.mapManager = null;
    this.issues = [];
  }

  async init() {
    // Load existing issues
    this.loadIssues();

    // Initialize constituency map
    this.mapManager = new ConstituencyMapManager('map');

    // Load constituency boundaries
    const geojson = await this.mapManager.loadConstituencies(
      'constituency_2019.geojson'
    );

    // Calculate statistics
    const stats = this.getConstituencyStats();

    // Display constituencies with data
    this.mapManager.displayConstituencies(geojson, stats);

    // Listen for constituency clicks
    window.addEventListener('constituencySelected', (e) => {
      console.log(`Selected: ${e.detail.name}`);
      this.showConstituencyDetails(e.detail.name);
    });
  }

  // Calculate issues per constituency
  getConstituencyStats() {
    const stats = {};

    this.issues.forEach(issue => {
      const constituency = issue.constituency || 'Unknown';
      stats[constituency] = (stats[constituency] || 0) + 1;
    });

    return stats;
  }

  // Show details for clicked constituency
  showConstituencyDetails(constituencyName) {
    const issues = this.issues.filter(i => i.constituency === constituencyName);
    const stats = this.getConstituencyStatsByStatus(issues);

    const html = `
      <div class="constituency-info">
        <h3>${constituencyName}</h3>
        <p><strong>Total Issues:</strong> ${issues.length}</p>
        <p><strong>Open:</strong> ${stats.open}</p>
        <p><strong>In Progress:</strong> ${stats.inProgress}</p>
        <p><strong>Resolved:</strong> ${stats.resolved}</p>
        <button onclick="app.showConstituencyMarkers('${constituencyName}')">
          View on Map
        </button>
      </div>
    `;

    document.body.innerHTML += html;
  }

  // Show only markers for this constituency
  showConstituencyMarkers(constituencyName) {
    if (!this.mapManager || !this.mapManager.markerClusterGroup) return;

    // Hide all markers
    this.mapManager.markerClusterGroup.clearLayers();

    // Show only this constituency's markers
    this.issues
      .filter(i => i.constituency === constituencyName)
      .forEach(issue => this.mapManager.addMarker(issue));

    // Fit to constituency bounds
    const feature = this.mapManager.constituencies[constituencyName];
    if (feature) {
      const bounds = this.mapManager.getBounds(feature.geometry.coordinates[0]);
      this.mapManager.map.fitBounds(bounds);
    }
  }

  getConstituencyStatsByStatus(issues) {
    return {
      total: issues.length,
      open: issues.filter(i => i.status === 'open').length,
      inProgress: issues.filter(i => i.status === 'in-progress').length,
      resolved: issues.filter(i => i.status === 'resolved').length
    };
  }

  loadIssues() {
    // Load from localStorage or API
    this.issues = JSON.parse(localStorage.getItem('issues')) || [];
  }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  window.app = new IssueReportingApp();
  app.init();
});
```

---

## 5️⃣ Choropleth Map (Color-coded by Data)

### Visual Example

```
🗺️ India Map with Constituencies

Dark Red (#d73027)     ███ 500+ issues (High)
Orange (#fc8d59)       ███ 300-500 issues
Yellow (#fee090)       ███ 100-300 issues
Light Blue (#91bfdb)   ███ 1-100 issues (Low)
Grey (#e0e0e0)         ███ 0 issues (No data)

User hovers over constituency:
  - Boundary highlights
  - Name appears
  - Issue count shows

User clicks constituency:
  - Popup shows details
  - Map zooms to that constituency
  - Shows individual markers
```

---

## 6️⃣ State-Level View (Grouped)

### Group by State

```javascript
// Get statistics by state
function getStateStats() {
  const stats = {};

  this.issues.forEach(issue => {
    const state = issue.state || 'Unknown';
    stats[state] = (stats[state] || 0) + 1;
  });

  return stats;
}

// Display state-level map
async displayStateMap() {
  // Load state boundaries (simpler than constituency)
  const states = await fetch('states_2019.geojson').then(r => r.json());
  const stateStats = this.getStateStats();

  L.geoJson(states, {
    style: (feature) => {
      const stateName = feature.properties.NAME;
      const count = stateStats[stateName] || 0;
      
      return {
        fillColor: this.getColorByCount(count),
        weight: 2,
        color: '#333',
        fillOpacity: 0.7
      };
    }
  }).addTo(this.map);
}
```

---

## 7️⃣ Drill-Down View

### User Interaction Flow

```
1. User opens map
   ↓
   Shows India (all constituencies as polygons)
   Color intensity = issue count

2. User hovers over constituency
   ↓
   Boundary highlights
   Name & count shown

3. User clicks constituency
   ↓
   Zooms to that constituency
   Shows individual markers (🔴🟠🟢)

4. User can:
   - Click marker for details
   - Filter by status
   - Go back to full map
```

---

## 8️⃣ Complete Integration with Tabbed UI

### Update index-tabbed.html

```html
<!-- Tab 2: Constituency View -->
<div id="map" class="tab-content">
  <div style="display: grid; grid-template-columns: 1fr 3fr; gap: 20px;">
    
    <!-- Sidebar: Stats -->
    <div style="padding: 20px; background: white; border-radius: 8px;">
      <h3>Top Constituencies</h3>
      <div id="topConstituencies" style="max-height: 600px; overflow-y: auto;">
        <!-- Dynamically populated -->
      </div>
    </div>

    <!-- Main: Map -->
    <div id="map" style="border-radius: 8px; height: 600px;"></div>
  </div>
</div>
```

### Update app.js

```javascript
class IssueReportingApp {
  // ... existing code ...

  // Initialize constituency map
  initConstituencyMap() {
    this.mapManager = new ConstituencyMapManager('map');
    
    // Load and display
    this.mapManager.loadConstituencies('constituency_2019.geojson')
      .then(geojson => {
        const stats = this.getConstituencyStats();
        this.mapManager.displayConstituencies(geojson, stats);
      });

    // Show top constituencies
    this.displayTopConstituencies();
  }

  // Display top 10 constituencies by issues
  displayTopConstituencies() {
    const stats = this.getConstituencyStats();
    const sorted = Object.entries(stats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    const html = sorted.map(([name, count]) => `
      <div style="padding: 10px; margin: 5px 0; background: #f5f5f5; 
                  border-radius: 5px; cursor: pointer;"
           onclick="app.mapManager.onConstituencyClick('${name}', ${count})">
        <strong>${name}</strong><br>
        <span style="color: #666;">${count} issues</span>
      </div>
    `).join('');

    document.getElementById('topConstituencies').innerHTML = html;
  }

  // Refresh when issues update
  async handleFormSubmit(e) {
    e.preventDefault();
    
    // ... existing code ...

    // Refresh constituency map
    const stats = this.getConstituencyStats();
    this.mapManager.displayConstituencies(geojson, stats);
    this.displayTopConstituencies();
  }
}
```

---

## 9️⃣ API Endpoint for Constituency Data

### Backend (Express)

```javascript
// Get statistics by constituency
app.get('/api/constituencies/stats', async (req, res) => {
  const stats = await db.issues.aggregate([
    {
      $group: {
        _id: "$constituency",
        total: { $sum: 1 },
        open: { $sum: { $cond: [{ $eq: ["$status", "open"] }, 1, 0] } },
        resolved: { $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] } }
      }
    },
    { $sort: { total: -1 } }
  ]).toArray();

  res.json({ data: stats });
});

// Get issues in specific constituency
app.get('/api/constituencies/:name/issues', async (req, res) => {
  const issues = await db.issues
    .find({ constituency: req.params.name })
    .sort({ created_at: -1 })
    .toArray();

  res.json({ data: issues, count: issues.length });
});
```

---

## 🔟 Files You Need

```
✅ constituency_2019.geojson      (543 constituencies - download from DataMeet)
✅ map-constituency.js             (ConstituencyMapManager class)
✅ app.js                          (Updated with constituency support)
✅ index-tabbed.html               (Updated with map tab)
```

---

## ✅ Features This Gives You

✅ **Visual India Map** - All 543 constituencies visible
✅ **Color Coding** - Intensity shows issue density
✅ **Statistics** - Hover to see counts
✅ **Drill Down** - Click to zoom into constituency
✅ **Markers** - See individual issues within constituency
✅ **State Overview** - Can group by state too
✅ **Interactive** - Hover effects, popups, clicks
✅ **Mobile Ready** - Responsive design
✅ **Scales** - Handles 1000+ issues easily

---

## 📊 Data Requirements

```
constituency_2019.geojson:
  - 543 features (one per constituency)
  - Each has NAME, STATE, REGION properties
  - Geometry: Polygon with detailed boundaries

Issues with constituency field:
  {
    id: "123",
    issue: "Pothole",
    constituency: "New Delhi",  ← Must match NAME in GeoJSON
    state: "Delhi",
    latitude: 28.7041,
    longitude: 77.1025,
    status: "open"
  }
```

---

## 🚀 Quick Start

1. **Download GeoJSON:**
   ```bash
   git clone https://github.com/datameet/india_electiondata.git
   cp india_electiondata/data/constituencies/constituency_2019.geojson .
   ```

2. **Create map-constituency.js:**
   Use the code provided above

3. **Update app.js:**
   Add `initConstituencyMap()` call

4. **Update HTML:**
   Add map container in constituency tab

5. **Add constituency field to issues:**
   When creating issues, set `constituency` field

6. **Run:**
   ```bash
   npm start
   http://localhost:3000
   ```

---

**Now you have a complete constituency-based map for India!** 🇮🇳🗺️
