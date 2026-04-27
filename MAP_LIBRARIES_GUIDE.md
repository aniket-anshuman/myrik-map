# Open Source JavaScript Map Libraries Guide

Comparison and integration examples for adding interactive maps to your issue reporting system.

---

## Quick Comparison

| Library | Size | Features | Best For | License |
|---------|------|----------|----------|---------|
| **Leaflet** | 40KB | Basic mapping | Simple maps, quick setup | BSD 2-Clause |
| **MapLibre GL JS** | 600KB | Vector tiles, 3D | Production-quality maps | BSD 3-Clause |
| **OpenLayers** | 800KB | GIS, WMS/WFS | Enterprise, GIS data | BSD 2-Clause |
| **CesiumJS** | 1.5MB | 3D globe, WebGL | 3D visualization | Apache 2.0 |
| **Deck.gl** | 500KB | Large datasets, WebGL | Big data visualization | MIT |

---

## 1. Leaflet (Recommended - Start Here!)

**Best for:** Quick implementation, simplicity, lightweight

### Installation

```bash
npm install leaflet
```

### Basic HTML Setup

```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        #map { height: 500px; }
    </style>
</head>
<body>
    <div id="map"></div>
    <script src="map-leaflet.js"></script>
</body>
</html>
```

### Complete Implementation (map-leaflet.js)

```javascript
class LeafletMapManager {
  constructor(containerId) {
    this.map = L.map(containerId).setView([40.7128, -74.0060], 13);
    
    // Add tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);
    
    this.markers = {};
    this.selectedMarker = null;
  }

  // Add issue marker
  addMarker(issue) {
    const marker = L.marker([issue.latitude, issue.longitude])
      .bindPopup(`
        <strong>${issue.issue}</strong><br>
        Category: ${issue.category}<br>
        Status: ${issue.status}
      `)
      .addTo(this.map);
    
    // Color code by status
    const color = this.getStatusColor(issue.status);
    const icon = L.icon({
      iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34]
    });
    
    marker.setIcon(icon);
    marker.issue = issue; // Store reference
    this.markers[issue.id] = marker;
    
    // Click handler
    marker.on('click', () => this.onMarkerClick(issue));
  }

  // Remove marker
  removeMarker(id) {
    if (this.markers[id]) {
      this.map.removeLayer(this.markers[id]);
      delete this.markers[id];
    }
  }

  // Update marker
  updateMarker(issue) {
    this.removeMarker(issue.id);
    this.addMarker(issue);
  }

  // Get status color
  getStatusColor(status) {
    const colors = {
      'open': 'red',
      'in-progress': 'yellow',
      'resolved': 'green',
      'closed': 'grey'
    };
    return colors[status] || 'blue';
  }

  // Filter by radius
  filterByRadius(centerLat, centerLng, radiusKm) {
    const filtered = {};
    const radiusMeters = radiusKm * 1000;
    
    for (let id in this.markers) {
      const marker = this.markers[id];
      const distance = this.calculateDistance(
        centerLat, centerLng,
        marker.getLatLng().lat,
        marker.getLatLng().lng
      );
      
      if (distance <= radiusMeters) {
        filtered[id] = marker;
      }
    }
    
    return filtered;
  }

  // Haversine distance formula
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    
    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Center on location
  centerOn(lat, lng, zoom = 15) {
    this.map.setView([lat, lng], zoom);
  }

  // Draw circle (search radius)
  drawSearchRadius(lat, lng, radiusKm) {
    L.circle([lat, lng], {
      color: 'blue',
      fillColor: '#30f',
      fillOpacity: 0.1,
      radius: radiusKm * 1000
    }).addTo(this.map);
  }

  // Get bounds of all markers
  fitAllMarkers() {
    if (Object.keys(this.markers).length === 0) return;
    
    const group = new L.featureGroup(Object.values(this.markers));
    this.map.fitBounds(group.getBounds());
  }

  // Marker click handler
  onMarkerClick(issue) {
    this.selectedMarker = issue.id;
    // Trigger event for parent app
    window.dispatchEvent(
      new CustomEvent('markerSelected', { detail: issue })
    );
  }
}

// Usage in your app.js
// Add this to IssueReportingApp class:
initMap() {
  this.mapManager = new LeafletMapManager('map');
  
  // Add existing issues to map
  this.issues.forEach(issue => this.mapManager.addMarker(issue));
  
  // Listen for marker clicks
  window.addEventListener('markerSelected', (e) => {
    console.log('Selected issue:', e.detail);
  });
}

updateMapOnSubmit(issue) {
  this.mapManager.addMarker(issue);
  this.mapManager.centerOn(issue.latitude, issue.longitude);
}

updateMapOnDelete(id) {
  this.mapManager.removeMarker(id);
}

updateMapOnStatusChange(issue) {
  this.mapManager.updateMarker(issue);
}
```

### Integration with Your App

Add to `index.html`:

```html
<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
  <!-- Map on the left -->
  <div id="map" style="border-radius: 10px; height: 600px;"></div>
  
  <!-- Issues list on the right -->
  <div id="issuesList"></div>
</div>

<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="map-leaflet.js"></script>
<script src="app.js"></script>
```

Update `app.js`:

```javascript
class IssueReportingApp {
  constructor() {
    // ... existing code ...
    this.mapManager = null;
  }

  init() {
    this.initMap(); // Add this
    this.loadIssuesFromStorage();
    // ... rest of init ...
  }

  initMap() {
    this.mapManager = new LeafletMapManager('map');
    this.issues.forEach(issue => this.mapManager.addMarker(issue));
  }

  handleFormSubmit(e) {
    // ... existing form handling ...
    // After creating issue:
    this.mapManager.addMarker(newIssue);
    this.mapManager.centerOn(newIssue.latitude, newIssue.longitude);
  }

  deleteIssue(id) {
    // ... existing delete code ...
    this.mapManager.removeMarker(id);
  }

  updateIssueStatus(id, status) {
    // ... existing status update ...
    const issue = this.issues.find(i => i.id === id);
    this.mapManager.updateMarker(issue);
  }
}
```

### Leaflet Plugins

```bash
# Clustering
npm install leaflet.markercluster

# Heat maps
npm install leaflet.heat

# Draw tools
npm install leaflet-draw

# Search
npm install leaflet-control-geocoder
```

Example with clustering:

```javascript
// leaflet.markercluster
const markerClusterGroup = L.markerClusterGroup();
this.issues.forEach(issue => {
  const marker = L.marker([issue.latitude, issue.longitude]);
  markerClusterGroup.addLayer(marker);
});
this.map.addLayer(markerClusterGroup);
```

---

## 2. MapLibre GL JS (Production Quality)

**Best for:** Vector tiles, 3D, style customization, Mapbox replacement

### Installation

```bash
npm install maplibre-gl
```

### Setup

```html
<script src='https://cdn.jsdelivr.net/npm/maplibre-gl@4.0.0/dist/maplibre-gl.js'></script>
<link href='https://cdn.jsdelivr.net/npm/maplibre-gl@4.0.0/dist/maplibre-gl.css' rel='stylesheet' />

<div id="map" style="width: 100%; height: 600px;"></div>
```

### Implementation

```javascript
class MapLibreMapManager {
  constructor(containerId) {
    this.map = new maplibregl.Map({
      container: containerId,
      style: 'https://demotiles.maplibre.org/style.json',
      center: [-74.0060, 40.7128],
      zoom: 13
    });

    this.markers = {};
  }

  addMarker(issue) {
    const el = document.createElement('div');
    el.className = 'marker';
    el.style.backgroundImage = this.getMarkerImage(issue.status);
    el.style.width = '32px';
    el.style.height = '32px';
    el.style.backgroundSize = '100%';
    el.style.cursor = 'pointer';

    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([issue.longitude, issue.latitude])
      .setPopup(new maplibregl.Popup()
        .setHTML(`
          <strong>${issue.issue}</strong><br>
          Category: ${issue.category}<br>
          Status: ${issue.status}
        `))
      .addTo(this.map);

    this.markers[issue.id] = marker;
  }

  getMarkerImage(status) {
    const colors = {
      'open': 'url(...red-marker.png)',
      'in-progress': 'url(...yellow-marker.png)',
      'resolved': 'url(...green-marker.png)'
    };
    return colors[status] || 'url(...blue-marker.png)';
  }

  removeMarker(id) {
    if (this.markers[id]) {
      this.markers[id].remove();
      delete this.markers[id];
    }
  }

  // Heatmap layer
  addHeatmapLayer(issues) {
    const data = {
      type: 'FeatureCollection',
      features: issues.map(issue => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [issue.longitude, issue.latitude]
        },
        properties: { intensity: 1 }
      }))
    };

    this.map.addSource('heatmap-source', { type: 'geojson', data });
    this.map.addLayer({
      id: 'heatmap-layer',
      type: 'heatmap',
      source: 'heatmap-source',
      paint: {
        'heatmap-weight': ['interpolate', ['linear'], ['get', 'intensity'], 0, 0, 100, 1],
        'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 9, 3],
        'heatmap-color': [
          'interpolate',
          ['linear'],
          ['heatmap-density'],
          0, 'rgba(0, 0, 255, 0)',
          0.1, 'royalblue',
          0.3, 'cyan',
          0.5, 'lime',
          0.7, 'yellow',
          1, 'red'
        ],
        'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 9, 20]
      }
    });
  }
}
```

---

## 3. OpenLayers (Enterprise GIS)

**Best for:** GIS data, WMS/WFS services, OGC standards

### Installation

```bash
npm install ol
```

### Implementation

```javascript
import Map from 'ol/Map.js';
import OSM from 'ol/source/OSM.js';
import TileLayer from 'ol/layer/Tile.js';
import View from 'ol/View.js';
import { fromLonLat } from 'ol/proj.js';
import Feature from 'ol/Feature.js';
import Point from 'ol/geom/Point.js';
import VectorSource from 'ol/source/Vector.js';
import VectorLayer from 'ol/layer/Vector.js';
import Style from 'ol/style/Style.js';
import Icon from 'ol/style/Icon.js';

class OpenLayersMapManager {
  constructor(containerId) {
    const vectorSource = new VectorSource();

    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: (feature) => this.getFeatureStyle(feature)
    });

    this.map = new Map({
      target: containerId,
      layers: [
        new TileLayer({
          source: new OSM()
        }),
        vectorLayer
      ],
      view: new View({
        center: fromLonLat([-74.0060, 40.7128]),
        zoom: 13
      })
    });

    this.vectorSource = vectorSource;
    this.features = {};
  }

  addMarker(issue) {
    const feature = new Feature({
      geometry: new Point(fromLonLat([issue.longitude, issue.latitude])),
      issue: issue
    });

    this.vectorSource.addFeature(feature);
    this.features[issue.id] = feature;
  }

  getFeatureStyle(feature) {
    const issue = feature.get('issue');
    const color = this.getStatusColor(issue.status);

    return new Style({
      image: new Icon({
        src: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><circle cx="16" cy="16" r="14" fill="${color}"/></svg>`,
        scale: 1
      })
    });
  }

  getStatusColor(status) {
    const colors = {
      'open': '#ff0000',
      'in-progress': '#ffff00',
      'resolved': '#00ff00'
    };
    return colors[status] || '#0000ff';
  }

  removeMarker(id) {
    if (this.features[id]) {
      this.vectorSource.removeFeature(this.features[id]);
      delete this.features[id];
    }
  }
}
```

---

## 4. CesiumJS (3D Visualization)

**Best for:** 3D globes, terrain, elevation data

### Installation

```bash
npm install cesium
```

### Basic Setup

```html
<script src="https://cesium.com/downloads/cesiumjs/releases/1.104/Cesium.js"></script>
<link href="https://cesium.com/downloads/cesiumjs/releases/1.104/Widgets/widgets.css" rel="stylesheet">

<div id="cesiumContainer" style="width: 100%; height: 600px;"></div>
```

### Implementation

```javascript
class CesiumMapManager {
  constructor(containerId) {
    Cesium.Ion.defaultAccessToken = 'YOUR_CESIUM_TOKEN'; // Get free token at ion.cesium.com

    this.viewer = new Cesium.Viewer(containerId, {
      terrain: Cesium.Terrain.fromUrl(
        Cesium.IonResource.fromAssetId(1)
      )
    });

    this.entities = {};
  }

  addMarker(issue) {
    const entity = this.viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(
        issue.longitude,
        issue.latitude,
        0
      ),
      point: {
        pixelSize: 10,
        color: this.getStatusColor(issue.status),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2
      },
      label: {
        text: issue.issue,
        font: '14px sans-serif',
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM
      }
    });

    entity.issue = issue;
    this.entities[issue.id] = entity;
  }

  getStatusColor(status) {
    const colors = {
      'open': Cesium.Color.RED,
      'in-progress': Cesium.Color.YELLOW,
      'resolved': Cesium.Color.GREEN
    };
    return colors[status] || Cesium.Color.BLUE;
  }
}
```

---

## 5. Deck.gl (Big Data Visualization)

**Best for:** Large datasets, heatmaps, hexagon layers

### Installation

```bash
npm install @deck.gl/core @deck.gl/layers @deck.gl/geo-layers
```

### Implementation

```javascript
import { Deck } from '@deck.gl/core';
import { ScatterplotLayer, HexagonLayer } from '@deck.gl/layers';

class DeckglMapManager {
  constructor(containerId) {
    this.deck = new Deck({
      container: containerId,
      initialViewState: {
        longitude: -74.0060,
        latitude: 40.7128,
        zoom: 13
      },
      controller: true,
      layers: []
    });
  }

  addScatterplot(issues) {
    const layer = new ScatterplotLayer({
      id: 'issues-scatterplot',
      data: issues,
      pickable: true,
      getPosition: d => [d.longitude, d.latitude],
      getRadius: d => 100,
      getColor: d => this.getStatusColor(d.status)
    });

    this.deck.setProps({ layers: [layer] });
  }

  addHexagon(issues) {
    const layer = new HexagonLayer({
      id: 'issues-hexagon',
      data: issues,
      getPosition: d => [d.longitude, d.latitude],
      getElevationValue: points => points.length,
      elevationScale: 50,
      extruded: true,
      radius: 50,
      colorRange: [
        [0, 0, 255],
        [0, 255, 255],
        [0, 255, 0],
        [255, 255, 0],
        [255, 0, 0]
      ]
    });

    this.deck.setProps({ layers: [layer] });
  }

  getStatusColor(status) {
    const colors = {
      'open': [255, 0, 0],
      'in-progress': [255, 255, 0],
      'resolved': [0, 255, 0]
    };
    return colors[status] || [0, 0, 255];
  }
}
```

---

## Recommendation by Use Case

### Simple Requirements
👉 **Use Leaflet**
- Lightweight
- Easy to implement
- Perfect for your current app
- Rich ecosystem of plugins

### Production Quality / Mapbox Alternative
👉 **Use MapLibre GL JS**
- Vector tiles support
- 3D capabilities
- Style customization
- No vendor lock-in

### GIS / Enterprise
👉 **Use OpenLayers**
- WMS/WFS support
- Comprehensive format support
- Enterprise features
- Government standards

### 3D Visualization
👉 **Use CesiumJS**
- 3D globe
- Terrain support
- Geospatial analysis
- High-quality rendering

### Big Data / Heatmaps
👉 **Use Deck.gl**
- Millions of data points
- High performance
- Stunning visualizations
- WebGL power

---

## Integration Path for Your App

### Step 1: Add Leaflet (NOW)
```html
<!-- Add to index.html -->
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<div style="display: grid; grid-template-columns: 1fr 1fr;">
  <div id="map" style="height: 600px;"></div>
  <div id="content"></div>
</div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="map-leaflet.js"></script>
```

### Step 2: Add MapLibre GL (LATER)
When you need:
- Vector tiles
- 3D rendering
- Runtime styling

### Step 3: Advanced Visualization (FUTURE)
- Heatmaps with Deck.gl
- 3D with CesiumJS
- GIS with OpenLayers

---

## CDN Links (No Installation)

```html
<!-- Leaflet -->
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

<!-- MapLibre GL JS -->
<link href='https://cdn.jsdelivr.net/npm/maplibre-gl@4.0.0/dist/maplibre-gl.css' rel='stylesheet' />
<script src='https://cdn.jsdelivr.net/npm/maplibre-gl@4.0.0/dist/maplibre-gl.js'></script>

<!-- OpenLayers -->
<script src="https://cdn.jsdelivr.net/npm/ol@8.0.0/dist/ol.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ol@8.0.0/ol.css">

<!-- CesiumJS -->
<script src="https://cesium.com/downloads/cesiumjs/releases/1.104/Cesium.js"></script>
<link href="https://cesium.com/downloads/cesiumjs/releases/1.104/Widgets/widgets.css" rel="stylesheet">
```

---

## Tile Layer Options (Free)

```javascript
// OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

// OpenTopoMap
L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenTopoMap'
}).addTo(map);

// CartoDB
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '© CartoDB'
}).addTo(map);

// USGS
L.tileLayer('https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}', {
  attribution: '© USGS'
}).addTo(map);
```

---

## Next Steps

1. **Choose Leaflet** for immediate implementation
2. **Create map-leaflet.js** with the code above
3. **Update index.html** to include map container
4. **Integrate into app.js** to show issues on map
5. **Add filtering** by radius, category, status
6. **Upgrade to MapLibre** when you need advanced features

**Start with Leaflet - it's the easiest and most popular choice!**
