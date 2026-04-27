#!/usr/bin/env node

/**
 * Import Indian Constituencies Data
 *
 * This script imports constituency boundaries and data from:
 * https://github.com/datameet/india_electiondata
 *
 * Usage:
 * node import-constituencies.js <geojson-file> [options]
 *
 * Example:
 * node import-constituencies.js constituency_2019.geojson
 */

const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'issues-db';
const COLLECTION = 'constituencies';

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: node import-constituencies.js <geojson-file> [--drop]');
    console.error('Example: node import-constituencies.js constituency_2019.geojson');
    process.exit(1);
  }

  return {
    file: args[0],
    dropExisting: args.includes('--drop'),
    verbose: args.includes('--verbose')
  };
}

/**
 * Load and parse GeoJSON file
 */
function loadGeoJSON(filepath) {
  console.log(`📂 Loading GeoJSON file: ${filepath}`);

  if (!fs.existsSync(filepath)) {
    throw new Error(`File not found: ${filepath}`);
  }

  const fileContent = fs.readFileSync(filepath, 'utf8');
  const geojson = JSON.parse(fileContent);

  if (!geojson.features) {
    throw new Error('Invalid GeoJSON: missing features array');
  }

  console.log(`✓ Loaded ${geojson.features.length} features`);
  return geojson;
}

/**
 * Transform GeoJSON features to MongoDB documents
 */
function transformFeatures(features) {
  console.log('🔄 Transforming features...');

  return features.map((feature, index) => {
    const props = feature.properties || {};
    const geometry = feature.geometry;

    return {
      // ID
      id: index + 1,

      // Basic info
      name: props.NAME || props.PC_NAME || `Constituency_${index + 1}`,
      state: props.STATE || props.ST_NAME || 'Unknown',
      region: props.REGION || null,

      // Electoral info (if available)
      pc_code: props.PC_CODE || null,
      election_year: props.YEAR || 2019,

      // Geometry (for geospatial queries)
      geometry: {
        type: geometry.type,
        coordinates: geometry.coordinates
      },

      // Center point (for quick lookups)
      center: calculateCentroid(geometry.coordinates),

      // Stats
      population: props.POPULATION || null,
      area: props.AREA_KM2 || null,

      // Metadata
      properties: props,
      created_at: new Date(),
      updated_at: new Date()
    };
  });
}

/**
 * Calculate centroid of a polygon
 */
function calculateCentroid(coordinates) {
  if (!coordinates || coordinates.length === 0) return null;

  const poly = coordinates[0]; // First ring of polygon
  if (!poly || poly.length === 0) return null;

  let x = 0, y = 0;
  for (let i = 0; i < poly.length - 1; i++) {
    x += poly[i][0];
    y += poly[i][1];
  }

  return {
    type: 'Point',
    coordinates: [x / (poly.length - 1), y / (poly.length - 1)]
  };
}

/**
 * Connect to MongoDB and import data
 */
async function importToMongoDB(documents, options) {
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log(`🔗 Connecting to MongoDB: ${MONGODB_URI}`);
    await client.connect();

    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION);

    // Drop existing collection if requested
    if (options.dropExisting) {
      console.log('🗑️  Dropping existing collection...');
      try {
        await collection.drop();
        console.log('✓ Collection dropped');
      } catch (err) {
        // Collection doesn't exist, that's fine
      }
    }

    // Insert documents
    console.log(`📝 Inserting ${documents.length} constituencies...`);
    const result = await collection.insertMany(documents);
    console.log(`✓ Inserted ${result.insertedIds.length} documents`);

    // Create indexes
    console.log('🔍 Creating indexes...');

    await collection.createIndex({ name: 1 });
    console.log('  ✓ Index on name');

    await collection.createIndex({ state: 1 });
    console.log('  ✓ Index on state');

    await collection.createIndex({ geometry: '2dsphere' });
    console.log('  ✓ Geospatial index (2dsphere)');

    await collection.createIndex({ 'center': '2dsphere' });
    console.log('  ✓ Geospatial index on centroid');

    await collection.createIndex({ created_at: -1 });
    console.log('  ✓ Index on created_at');

    // Show stats
    console.log('\n📊 Import Statistics:');
    const stats = await db.collection(COLLECTION).stats();
    console.log(`  Total documents: ${stats.count}`);
    console.log(`  Storage size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

    // Show sample
    console.log('\n📍 Sample Constituencies:');
    const samples = await collection.find().limit(5).toArray();
    samples.forEach(c => {
      console.log(`  - ${c.name} (${c.state})`);
    });

    console.log('\n✅ Import completed successfully!');

  } finally {
    await client.close();
  }
}

/**
 * Verify data integrity
 */
async function verifyData() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION);

    console.log('\n🔎 Verifying data...');

    // Check total count
    const count = await collection.countDocuments();
    console.log(`  ✓ Total constituencies: ${count}`);

    // Check states
    const states = await collection.distinct('state');
    console.log(`  ✓ States: ${states.length}`);
    console.log(`    ${states.join(', ')}`);

    // Check geometries
    const withGeometry = await collection.countDocuments({ geometry: { $exists: true } });
    console.log(`  ✓ Constituencies with geometry: ${withGeometry}`);

    // Test geospatial query
    const nearDelhi = await collection.find({
      center: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [77.1025, 28.7041] // Delhi coordinates
          },
          $maxDistance: 200000 // 200km
        }
      }
    }).limit(5).toArray();

    console.log(`  ✓ Geospatial query (within 200km of Delhi): ${nearDelhi.length} results`);
    if (nearDelhi.length > 0) {
      console.log(`    Sample: ${nearDelhi[0].name}`);
    }

  } finally {
    await client.close();
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    const options = parseArgs();

    console.log('========================================');
    console.log('  Indian Constituencies Data Importer  ');
    console.log('========================================\n');

    // Load GeoJSON
    const geojson = loadGeoJSON(options.file);

    // Transform features
    const documents = transformFeatures(geojson.features);

    // Import to MongoDB
    await importToMongoDB(documents, options);

    // Verify
    await verifyData();

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = {
  loadGeoJSON,
  transformFeatures,
  importToMongoDB
};
