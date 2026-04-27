// ============================================================
// Leaflet Map Manager for Issue Reporting System
// ============================================================

class LeafletMapManager {
  constructor(containerId) {
    // Initialize map centered on India
    this.map = L.map(containerId).setView([20.5937, 78.9629], 5);

    // Add OpenStreetMap tiles
    this.tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      className: 'map-tile-layer'
    }).addTo(this.map);

    // Storage for markers
    this.markers = {};
    this.markerClusterGroup = null;
    this.selectedMarker = null;
    this.searchRadius = null;

    // Initialize marker cluster group
    this.initializeClusterGroup();
  }

  // ============================================================
  // Initialization
  // ============================================================

  initializeClusterGroup() {
    // Requires: https://unpkg.com/leaflet.markercluster@1.4.1/dist/leaflet.markercluster.js
    if (window.L.markerClusterGroup) {
      this.markerClusterGroup = L.markerClusterGroup({
        maxClusterRadius: 80,
        disableClusteringAtZoom: 16
      }).addTo(this.map);
    }
  }

  // ============================================================
  // Marker Management
  // ============================================================

  /**
   * Add issue marker to map
   * @param {Object} issue - Issue object with latitude, longitude, status, etc.
   */
  addMarker(issue) {
    if (!issue.latitude || !issue.longitude) return;

    // Create marker
    const marker = L.marker([issue.latitude, issue.longitude], {
      icon: this.getMarkerIcon(issue.status)
    });

    // Create popup content
    const popupContent = `
      <div class="map-popup">
        <h4 style="margin: 0 0 8px 0; color: #333;">
          ${this.escapeHtml(issue.issue)}
        </h4>
        <div style="font-size: 0.9em; color: #666;">
          <p style="margin: 4px 0;">
            <strong>Category:</strong> ${issue.category}
          </p>
          <p style="margin: 4px 0;">
            <strong>Status:</strong>
            <span style="display: inline-block; padding: 2px 8px;
                         background: ${this.getStatusBg(issue.status)};
                         color: white; border-radius: 3px; font-size: 0.85em;">
              ${issue.status}
            </span>
          </p>
          <p style="margin: 4px 0;">
            <strong>Location:</strong><br>
            ${issue.latitude.toFixed(4)}, ${issue.longitude.toFixed(4)}
          </p>
          ${issue.imageData ? `
            <p style="margin: 4px 0;">
              <strong>Image:</strong><br>
              <img src="${issue.imageData.data}" style="max-width: 200px; margin-top: 5px; border-radius: 4px;">
            </p>
          ` : ''}
          <p style="margin: 4px 0; font-size: 0.85em; color: #999;">
            ${new Date(issue.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    `;

    marker.bindPopup(popupContent, {
      maxWidth: 300,
      minWidth: 250
    });

    // Click event
    marker.on('click', () => {
      this.selectedMarker = issue.id;
      this.dispatchMarkerEvent('markerSelected', issue);
    });

    // Add to cluster group or directly to map
    if (this.markerClusterGroup) {
      this.markerClusterGroup.addLayer(marker);
    } else {
      marker.addTo(this.map);
    }

    // Store reference
    marker.issue = issue;
    this.markers[issue.id] = marker;
  }

  /**
   * Remove marker from map
   * @param {string} id - Issue ID
   */
  removeMarker(id) {
    const marker = this.markers[id];
    if (!marker) return;

    if (this.markerClusterGroup) {
      this.markerClusterGroup.removeLayer(marker);
    } else {
      this.map.removeLayer(marker);
    }

    delete this.markers[id];
  }

  /**
   * Update marker (remove and re-add)
   * @param {Object} issue - Updated issue object
   */
  updateMarker(issue) {
    this.removeMarker(issue.id);
    this.addMarker(issue);
  }

  /**
   * Clear all markers
   */
  clearMarkers() {
    Object.keys(this.markers).forEach(id => this.removeMarker(id));
  }

  // ============================================================
  // Marker Styling
  // ============================================================

  /**
   * Get marker icon based on status
   * @param {string} status - Issue status
   * @returns {L.Icon} - Leaflet icon
   */
  getMarkerIcon(status) {
    const colors = {
      'open': 'red',
      'in-progress': 'orange',
      'resolved': 'green',
      'closed': 'grey'
    };

    const color = colors[status] || 'blue';
    const url = `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`;

    return L.icon({
      iconUrl: url,
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
  }

  /**
   * Get status background color
   * @param {string} status - Issue status
   * @returns {string} - Hex color
   */
  getStatusBg(status) {
    const colors = {
      'open': '#ff6b6b',
      'in-progress': '#ffa500',
      'resolved': '#51cf66',
      'closed': '#868e96'
    };
    return colors[status] || '#0066cc';
  }

  // ============================================================
  // Search & Filter
  // ============================================================

  /**
   * Filter markers by radius
   * @param {number} centerLat - Center latitude
   * @param {number} centerLng - Center longitude
   * @param {number} radiusKm - Radius in kilometers
   * @returns {Object} - Filtered markers
   */
  filterByRadius(centerLat, centerLng, radiusKm) {
    const filtered = {};
    const radiusMeters = radiusKm * 1000;

    for (let id in this.markers) {
      const marker = this.markers[id];
      const latLng = marker.getLatLng();
      const distance = this.calculateDistance(centerLat, centerLng, latLng.lat, latLng.lng);

      if (distance <= radiusMeters) {
        filtered[id] = marker;
      }
    }

    return filtered;
  }

  /**
   * Filter markers by status
   * @param {string} status - Status to filter by
   * @returns {Object} - Filtered markers
   */
  filterByStatus(status) {
    const filtered = {};

    for (let id in this.markers) {
      const marker = this.markers[id];
      if (marker.issue.status === status) {
        filtered[id] = marker;
      }
    }

    return filtered;
  }

  /**
   * Filter markers by category
   * @param {string} category - Category to filter by
   * @returns {Object} - Filtered markers
   */
  filterByCategory(category) {
    const filtered = {};

    for (let id in this.markers) {
      const marker = this.markers[id];
      if (marker.issue.category === category) {
        filtered[id] = marker;
      }
    }

    return filtered;
  }

  /**
   * Highlight only matching markers
   * @param {string[]} ids - Array of issue IDs to show
   */
  highlightMarkers(ids) {
    const highlightSet = new Set(ids);

    for (let id in this.markers) {
      const marker = this.markers[id];
      const layer = marker instanceof L.Marker ? marker : marker.getLayers()[0];

      if (highlightSet.has(id)) {
        layer.setOpacity(1.0);
      } else {
        layer.setOpacity(0.3);
      }
    }
  }

  /**
   * Reset marker highlighting
   */
  resetHighlighting() {
    for (let id in this.markers) {
      const marker = this.markers[id];
      marker.setOpacity(1.0);
    }
  }

  // ============================================================
  // Search Radius
  // ============================================================

  /**
   * Draw search radius circle
   * @param {number} lat - Center latitude
   * @param {number} lng - Center longitude
   * @param {number} radiusKm - Radius in kilometers
   */
  drawSearchRadius(lat, lng, radiusKm) {
    // Remove old circle
    if (this.searchRadius) {
      this.map.removeLayer(this.searchRadius);
    }

    // Draw new circle
    this.searchRadius = L.circle([lat, lng], {
      color: '#667eea',
      fillColor: '#667eea',
      fillOpacity: 0.1,
      radius: radiusKm * 1000,
      weight: 2
    }).addTo(this.map);
  }

  /**
   * Clear search radius
   */
  clearSearchRadius() {
    if (this.searchRadius) {
      this.map.removeLayer(this.searchRadius);
      this.searchRadius = null;
    }
  }

  // ============================================================
  // Navigation
  // ============================================================

  /**
   * Center map on location
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {number} zoom - Zoom level
   */
  centerOn(lat, lng, zoom = 15) {
    this.map.setView([lat, lng], zoom);
  }

  /**
   * Fit all markers in view
   */
  fitAllMarkers() {
    const markerCount = Object.keys(this.markers).length;

    if (markerCount === 0) {
      // Default view - India
      this.centerOn(20.5937, 78.9629, 5);
      return;
    }

    if (markerCount === 1) {
      // Single marker
      const marker = Object.values(this.markers)[0];
      const latLng = marker.getLatLng();
      this.centerOn(latLng.lat, latLng.lng, 16);
      return;
    }

    // Multiple markers - fit bounds
    const bounds = L.latLngBounds(
      Object.values(this.markers).map(m => m.getLatLng())
    );
    this.map.fitBounds(bounds, { padding: [50, 50] });
  }

  /**
   * Pan to marker
   * @param {string} id - Issue ID
   */
  panToMarker(id) {
    const marker = this.markers[id];
    if (!marker) return;

    const latLng = marker.getLatLng();
    this.map.panTo(latLng);
    marker.openPopup();
  }

  // ============================================================
  // Utilities
  // ============================================================

  /**
   * Calculate distance between two coordinates (Haversine formula)
   * @param {number} lat1 - First latitude
   * @param {number} lon1 - First longitude
   * @param {number} lat2 - Second latitude
   * @param {number} lon2 - Second longitude
   * @returns {number} - Distance in meters
   */
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

  /**
   * Get all markers within radius
   * @param {number} lat - Center latitude
   * @param {number} lng - Center longitude
   * @param {number} radiusKm - Radius in kilometers
   * @returns {Array} - Array of issue objects
   */
  getMarkersInRadius(lat, lng, radiusKm) {
    const radiusMeters = radiusKm * 1000;
    const results = [];

    for (let id in this.markers) {
      const marker = this.markers[id];
      const latLng = marker.getLatLng();
      const distance = this.calculateDistance(lat, lng, latLng.lat, latLng.lng);

      if (distance <= radiusMeters) {
        results.push({
          ...marker.issue,
          distance: Math.round(distance)
        });
      }
    }

    return results.sort((a, b) => a.distance - b.distance);
  }

  /**
   * Get map bounds
   * @returns {Object} - Bounds object {north, south, east, west}
   */
  getBounds() {
    const bounds = this.map.getBounds();
    return {
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest()
    };
  }

  /**
   * Escape HTML special characters
   * @param {string} text - Text to escape
   * @returns {string} - Escaped text
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Dispatch custom event
   * @param {string} eventName - Event name
   * @param {Object} detail - Event detail
   */
  dispatchMarkerEvent(eventName, detail) {
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
  }

  // ============================================================
  // Heatmap (requires leaflet.heat)
  // ============================================================

  /**
   * Draw heatmap of issues
   * @param {Array} issues - Array of issue objects
   */
  drawHeatmap(issues) {
    const heatPoints = issues.map(issue => [
      issue.latitude,
      issue.longitude,
      1 // intensity
    ]);

    if (window.L.heat) {
      L.heat(heatPoints, {
        radius: 25,
        blur: 15,
        maxZoom: 17,
        max: 100,
        gradient: {
          0.0: '#0000ff',
          0.25: '#00ffff',
          0.5: '#00ff00',
          0.75: '#ffff00',
          1.0: '#ff0000'
        }
      }).addTo(this.map);
    }
  }

  // ============================================================
  // Tile Layer Switching
  // ============================================================

  /**
   * Switch tile layer
   * @param {string} tileName - Name of tile layer (osm, topo, cartodb, etc.)
   */
  switchTileLayer(tileName) {
    this.map.removeLayer(this.tileLayer);

    const tileOptions = {
      attribution: 'OpenStreetMap',
      maxZoom: 19
    };

    const tileLayers = {
      osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      topo: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      cartodb:
        'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      usgs: 'https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}'
    };

    this.tileLayer = L.tileLayer(tileLayers[tileName] || tileLayers.osm, tileOptions).addTo(
      this.map
    );
  }
}

// ============================================================
// Export for use in Node.js/modules
// ============================================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LeafletMapManager;
}
