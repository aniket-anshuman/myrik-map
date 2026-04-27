// ============================================================
// Fresh Data Seeding Script - Generate Test Issues by Constituency
// ============================================================

const Database = require('./database');
const fs = require('fs');

const db = new Database('./issues.db');

async function seedData() {
  try {
    console.log('🗑️  Clearing existing data...');
    await db.initialize();
    await db.clearAll();

    console.log('📍 Loading constituencies...');
    const geojsonPath = './india_pc_2019.json';
    if (!fs.existsSync(geojsonPath)) {
      console.error('❌ india_pc_2019.json not found!');
      process.exit(1);
    }

    const geojson = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));
    const constituencies = geojson.features;

    console.log(`✅ Loaded ${constituencies.length} constituencies`);

    // Categories for diverse test data
    const categories = [
      'Road Damage',
      'Pothole',
      'Street Light',
      'Sidewalk Issue',
      'Traffic Sign',
      'Drainage Issue',
      'Vegetation Issue',
      'Other'
    ];

    const statuses = ['open', 'in-progress', 'resolved'];

    const descriptions = [
      'Major issue affecting daily commute',
      'Safety hazard reported by residents',
      'Long-standing problem needs attention',
      'Recently noticed, urgent action needed',
      'Public complaint received',
      'High traffic area affected',
      'Needs immediate repair',
      'Maintenance overdue',
      'Safety risk to pedestrians',
      'Infrastructure damage'
    ];

    let totalIssues = 0;

    // Pick 10-11 random constituencies to add issues to
    const selectedConstituencies = [];
    const totalIssuesToAdd = Math.floor(Math.random() * 2) + 10; // 10-11 issues total

    for (let i = 0; i < totalIssuesToAdd; i++) {
      const randomConstituency = constituencies[Math.floor(Math.random() * constituencies.length)];
      selectedConstituencies.push(randomConstituency);
    }

    // Generate one issue per selected constituency
    for (const constituency of selectedConstituencies) {
      const props = constituency.properties;
      const name = props.pc_name || 'Unknown';
      const state = props.st_name || 'Unknown';

      // Get center point of constituency
      let centerLat = 20.5937; // Default India center
      let centerLng = 78.9629;

      if (constituency.geometry.type === 'MultiPolygon') {
        const firstPolygon = constituency.geometry.coordinates[0];
        if (firstPolygon && firstPolygon[0] && firstPolygon[0].length > 0) {
          const firstCoord = firstPolygon[0][0];
          centerLng = firstCoord[0];
          centerLat = firstCoord[1];
        }
      } else if (constituency.geometry.type === 'Polygon') {
        const firstCoord = constituency.geometry.coordinates[0][0];
        centerLng = firstCoord[0];
        centerLat = firstCoord[1];
      }

      // Add small random offset (within ~0.05 degrees)
      const offsetLat = (Math.random() - 0.5) * 0.05;
      const offsetLng = (Math.random() - 0.5) * 0.05;

      const issue = {
        issue: `${categories[Math.floor(Math.random() * categories.length)]} - ${descriptions[Math.floor(Math.random() * descriptions.length)]}`,
        category: categories[Math.floor(Math.random() * categories.length)],
        latitude: centerLat + offsetLat,
        longitude: centerLng + offsetLng,
        constituency: name,
        state: state,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        imageData: null,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
      };

      await db.addIssue(issue);
      totalIssues++;
      console.log(`✅ ${name} (${state}): 1 issue`);
    }

    console.log(`\n🎉 Successfully seeded ${totalIssues} total issues!`);

    await db.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

seedData();
