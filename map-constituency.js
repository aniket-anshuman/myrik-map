class ConstituencyMapManager {
  constructor(mapElementId, geojsonPath) {
    this.map = L.map(mapElementId).setView([20.5937, 78.9629], 5);
    this.geojsonPath = geojsonPath;
    this.constituencies = {};
    this.issuesByConstituency = {};
    this.geojsonLayer = null;
    this.markerGroup = L.markerClusterGroup();
    this.currentZoom = 'country';

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);

    this.map.on('click', () => {
      if (this.currentZoom === 'constituency') {
        this.showCountryView();
      }
    });
  }

  async loadConstituencies() {
    try {
      const response = await fetch(this.geojsonPath);
      const geojson = await response.json();

      geojson.features.forEach(feature => {
        // Handle property name variations for India PC GeoJSON
        const props = feature.properties;
        const name = props.pc_name || props.PC_NAME || props.NAME || props.name || 'Unknown';
        const state = props.st_name || props.ST_NAME || props.STATE || props.state || '';

        // Store with normalized properties
        feature.properties.NAME = name;
        feature.properties.STATE = state;

        this.constituencies[name] = feature;
      });

      console.log(`✅ Loaded ${Object.keys(this.constituencies).length} constituencies`);
      this.displayConstituencies();
    } catch (error) {
      console.error('Error loading constituencies:', error);
    }
  }

  displayConstituencies() {
    if (this.geojsonLayer) {
      this.map.removeLayer(this.geojsonLayer);
    }

    console.log(`🗺️ Displaying ${Object.keys(this.constituencies).length} constituencies with ${Object.values(this.issuesByConstituency).reduce((a, b) => a + b, 0)} issues`);

    this.geojsonLayer = L.geoJSON(
      Object.values(this.constituencies),
      {
        style: (feature) => this.getFeatureStyle(feature),
        onEachFeature: (feature, layer) => this.onEachFeature(feature, layer)
      }
    ).addTo(this.map);

    // Add info box showing total counts
    this.addInfoBox();
  }

  addInfoBox() {
    const totalIssues = Object.values(this.issuesByConstituency).reduce((a, b) => a + b, 0);
    const constWithIssues = Object.keys(this.issuesByConstituency).filter(c => this.issuesByConstituency[c] > 0).length;

    const info = L.control({ position: 'topright' });
    info.onAdd = () => {
      const div = L.DomUtil.create('div', 'info');
      div.style.backgroundColor = 'white';
      div.style.padding = '15px';
      div.style.borderRadius = '8px';
      div.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
      div.style.fontFamily = 'Arial, sans-serif';
      div.style.fontSize = '14px';
      // div.innerHTML = `
      //   <strong>Constituency Overview</strong><br>
      //   📍 Total Issues: <strong>${totalIssues}</strong><br>
      //   🏛️ Constituencies: <strong>${constWithIssues}</strong><br>
      //   <small style="color: #666;">Click to zoom & view markers</small>
      // `;
      return div;
    };
    info.addTo(this.map);
  }

  getFeatureStyle(feature) {
    const name = feature.properties.NAME || feature.properties.name;
    const issueCount = this.issuesByConstituency[name] || 0;

    let color;
    if (issueCount > 500) color = '#d73027';      // dark red
    else if (issueCount > 300) color = '#fc8d59'; // orange
    else if (issueCount > 100) color = '#fee090'; // yellow
    else if (issueCount > 0) color = '#91bfdb';   // light blue
    else color = '#e0e0e0';                         // grey

    return {
      fillColor: color,
      weight: 1,
      opacity: 1,
      color: '#333',
      fillOpacity: 0.7
    };
  }

  onEachFeature(feature, layer) {
    const name = feature.properties.NAME || feature.properties.name;
    const state = feature.properties.STATE || feature.properties.state || '';
    const issueCount = this.issuesByConstituency[name] || 0;

    const popupContent = `
      <div class="constituency-popup">
        <strong>${name}</strong><br>
        State: ${state}<br>
        Issues: ${issueCount}<br>
        <button onclick="window.constituencyMapManager.zoomToConstituency('${name}')">
          View Issues
        </button>
      </div>
    `;

    layer.bindPopup(popupContent);
    layer.on('click', (e) => {
      e.stopPropagation();
      this.zoomToConstituency(name);
    });
  }

  async zoomToConstituency(constituencyName) {
    const feature = this.constituencies[constituencyName];
    if (!feature) return;

    // Zoom to constituency bounds
    const bounds = L.geoJSON(feature).getBounds();
    this.map.fitBounds(bounds, { padding: [50, 50] });

    this.currentZoom = 'constituency';

    // Load and show individual markers for this constituency
    await this.showConstituencyMarkers(constituencyName);
  }

  async showConstituencyMarkers(constituencyName) {
    this.markerGroup.clearLayers();

    try {
      console.log(`📍 Fetching issues for ${constituencyName}...`);
      const response = await fetch(`/api/constituencies/${encodeURIComponent(constituencyName)}/issues`);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      const data = result.data || [];

      console.log(`✅ Found ${data.length} issues in ${constituencyName}`);

      if (data.length === 0) {
        console.log(`⚠️ No issues found for ${constituencyName}`);
      }

      data.forEach(issue => {
        // Handle both location formats
        let lat, lng;
        if (issue.location && issue.location.coordinates) {
          [lng, lat] = issue.location.coordinates;
        } else if (issue.latitude !== undefined && issue.longitude !== undefined) {
          lat = issue.latitude;
          lng = issue.longitude;
        } else {
          return; // Skip if no coordinates
        }

        const color = this.getMarkerColor(issue.status);
        const icon = L.divIcon({
          className: 'issue-marker',
          html: `<div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">●</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const popupContent = `
          <div style="font-family: Arial; font-size: 13px;">
            <strong>${this.escapeHtml(issue.issue || 'Issue')}</strong><br>
            Category: ${issue.category}<br>
            Status: <span style="color: ${color}; font-weight: bold;">${issue.status}</span><br>
            Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}<br>
            ${issue.constituency ? `Constituency: ${issue.constituency}` : ''}
          </div>
        `;

        L.marker([lat, lng], { icon })
          .bindPopup(popupContent)
          .addTo(this.markerGroup);

        console.log(`  📍 Added marker: ${issue.issue}`);
      });

      this.markerGroup.addTo(this.map);
      console.log(`✅ Displayed ${data.length} markers`);

    } catch (error) {
      console.error('❌ Error loading constituency markers:', error);
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  getMarkerColor(status) {
    const colors = {
      'open': '#e74c3c',      // red
      'in-progress': '#f39c12', // orange
      'resolved': '#27ae60',    // green
      'default': '#95a5a6'      // grey
    };
    return colors[status] || colors['default'];
  }

  showCountryView() {
    this.map.setView([20.5937, 78.9629], 4.5);
    this.markerGroup.clearLayers();
    this.currentZoom = 'country';
    console.log('🇮🇳 Showing country view');
  }

  fitToConstituencies() {
    if (Object.keys(this.constituencies).length === 0) return;

    const allCoordinates = [];
    for (const feature of Object.values(this.constituencies)) {
      if (feature.geometry.type === 'Polygon') {
        feature.geometry.coordinates[0].forEach(coord => {
          allCoordinates.push([coord[1], coord[0]]);
        });
      } else if (feature.geometry.type === 'MultiPolygon') {
        feature.geometry.coordinates.forEach(polygon => {
          polygon[0].forEach(coord => {
            allCoordinates.push([coord[1], coord[0]]);
          });
        });
      }
    }

    if (allCoordinates.length > 0) {
      const bounds = L.latLngBounds(allCoordinates);
      this.map.fitBounds(bounds, { padding: [50, 50] });
    }
  }

  async updateIssueStats(issuesData) {
    this.issuesByConstituency = {};

    issuesData.forEach(issue => {
      const constituency = issue.constituency || 'Unknown';
      this.issuesByConstituency[constituency] =
        (this.issuesByConstituency[constituency] || 0) + 1;
    });

    // Redraw with updated colors
    if (this.geojsonLayer) {
      this.displayConstituencies();
    }
  }

  getConstituencyStats() {
    return this.issuesByConstituency;
  }

  // Find which constituency a point (lat, lng) belongs to
  getConstituencyForPoint(lat, lng) {
    for (const [name, feature] of Object.entries(this.constituencies)) {
      if (this.isPointInPolygon([lng, lat], feature.geometry)) {
        return name;
      }
    }
    return null;
  }

  // Point-in-polygon test (Turf.js-like algorithm)
  isPointInPolygon(point, geometry) {
    const [lon, lat] = point;

    if (geometry.type === 'Polygon') {
      return this.pointInPolygon([lon, lat], geometry.coordinates);
    } else if (geometry.type === 'MultiPolygon') {
      for (const polygon of geometry.coordinates) {
        if (this.pointInPolygon([lon, lat], polygon)) {
          return true;
        }
      }
    }
    return false;
  }

  pointInPolygon(point, coords) {
    const [x, y] = point;
    let inside = false;

    for (let i = 0, j = coords[0].length - 1; i < coords[0].length; j = i++) {
      const xi = coords[0][i][0], yi = coords[0][i][1];
      const xj = coords[0][j][0], yj = coords[0][j][1];

      const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }

    return inside;
  }
}
