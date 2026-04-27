// ============================================================
// SQLite Database Manager for Issue Reporting System
// ============================================================

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
  constructor(dbPath = './issues.db') {
    this.dbPath = dbPath;
    this.db = null;
    this.cache = {
      statistics: null,
      categoryStats: null,
      lastCacheTime: 0
    };
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  }

  initialize() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          reject(err);
        } else {
          this.createTables()
            .then(() => resolve())
            .catch(reject);
        }
      });
    });
  }

  createTables() {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        // Create issues table (IF NOT EXISTS preserves existing data)
        this.db.run(
          `
          CREATE TABLE IF NOT EXISTS issues (
            id TEXT PRIMARY KEY,
            issue TEXT NOT NULL,
            category TEXT NOT NULL,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            constituency TEXT,
            state TEXT,
            status TEXT DEFAULT 'open',
            imageUrl TEXT,
            imageName TEXT,
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL
          )
          `,
          (err) => {
            if (err) reject(err);
          }
        );

        // Create comments table
        this.db.run(
          `
          CREATE TABLE IF NOT EXISTS comments (
            id TEXT PRIMARY KEY,
            issueId TEXT NOT NULL,
            text TEXT NOT NULL,
            createdAt TEXT NOT NULL,
            FOREIGN KEY (issueId) REFERENCES issues(id) ON DELETE CASCADE
          )
          `,
          (err) => {
            if (err) reject(err);
          }
        );

        // Create indexes for query optimization
        this.db.run('CREATE INDEX IF NOT EXISTS idx_status ON issues(status)');
        this.db.run('CREATE INDEX IF NOT EXISTS idx_category ON issues(category)');
        this.db.run('CREATE INDEX IF NOT EXISTS idx_constituency ON issues(constituency)');
        this.db.run('CREATE INDEX IF NOT EXISTS idx_state ON issues(state)');
        this.db.run('CREATE INDEX IF NOT EXISTS idx_createdAt ON issues(createdAt DESC)');
        this.db.run('CREATE INDEX IF NOT EXISTS idx_issueId_comments ON comments(issueId)');

        // Spatial index support (SQLite doesn't have native spatial index, but we enable R*Tree if available)
        this.db.run(
          `CREATE VIRTUAL TABLE IF NOT EXISTS issues_spatial USING rtree(
            id, minLat, maxLat, minLng, maxLng
          )`,
          (err) => {
            // If R*Tree is not available, continue anyway (not critical)
            if (err) console.log('R*Tree not available, using standard indexing');
          }
        );

        // Enable query optimization settings
        this.db.run('PRAGMA optimize;', (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    });
  }

  // ============================================================
  // Issue Operations
  // ============================================================

  addIssue(issue) {
    return new Promise((resolve, reject) => {
      const {
        id,
        issue: description,
        category,
        latitude,
        longitude,
        constituency,
        state,
        status,
        imageData,
        imageUrl,
        imageName,
        createdAt
      } = issue;

      const stmt = this.db.prepare(
        `INSERT INTO issues
         (id, issue, category, latitude, longitude, constituency, state, status, imageUrl, imageName, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );

      stmt.run(
        id,
        description,
        category,
        latitude,
        longitude,
        constituency || null,
        state || null,
        status,
        imageUrl || imageData || null,
        imageName,
        createdAt,
        new Date().toISOString(),
        (err) => {
          stmt.finalize();
          if (err) reject(err);
          else {
            this.invalidateCache();
            resolve(issue);
          }
        }
      );
    });
  }

  getIssue(id) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM issues WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row || null);
      });
    });
  }

  getAllIssues(limit = 100, offset = 0) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM issues ORDER BY createdAt DESC LIMIT ? OFFSET ?',
        [limit, offset],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }

  getTotalIssuesCount() {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT COUNT(*) as count FROM issues', (err, row) => {
        if (err) reject(err);
        else resolve(row?.count || 0);
      });
    });
  }

  updateIssue(id, updates) {
    return new Promise((resolve, reject) => {
      const { status, issue, category } = updates;
      const updatedAt = new Date().toISOString();

      let query = 'UPDATE issues SET updatedAt = ?';
      const params = [updatedAt];

      if (status !== undefined) {
        query += ', status = ?';
        params.push(status);
      }
      if (issue !== undefined) {
        query += ', issue = ?';
        params.push(issue);
      }
      if (category !== undefined) {
        query += ', category = ?';
        params.push(category);
      }

      query += ' WHERE id = ?';
      params.push(id);

      const stmt = this.db.prepare(query);
      stmt.run(...params, function (err) {
        stmt.finalize();
        if (err) reject(err);
        else if (this.changes > 0) resolve(true);
        else resolve(false);
      });
    });
  }

  deleteIssue(id) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare('DELETE FROM issues WHERE id = ?');
      stmt.run(id, function (err) {
        stmt.finalize();
        if (err) reject(err);
        else resolve(this.changes > 0);
      });
    });
  }

  // ============================================================
  // Query Operations
  // ============================================================

  getIssuesByStatus(status, limit = 100, offset = 0) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM issues WHERE status = ? ORDER BY createdAt DESC LIMIT ? OFFSET ?',
        [status, limit, offset],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }

  getIssuesByStatusCount(status) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT COUNT(*) as count FROM issues WHERE status = ?',
        [status],
        (err, row) => {
          if (err) reject(err);
          else resolve(row?.count || 0);
        }
      );
    });
  }

  getIssuesByCategory(category, limit = 100, offset = 0) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM issues WHERE category = ? ORDER BY createdAt DESC LIMIT ? OFFSET ?',
        [category, limit, offset],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }

  getIssuesByCategoryCount(category) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT COUNT(*) as count FROM issues WHERE category = ?',
        [category],
        (err, row) => {
          if (err) reject(err);
          else resolve(row?.count || 0);
        }
      );
    });
  }

  searchIssues(searchTerm, limit = 100, offset = 0) {
    return new Promise((resolve, reject) => {
      const query = '%' + searchTerm.toLowerCase() + '%';
      this.db.all(
        `SELECT * FROM issues
         WHERE LOWER(issue) LIKE ? OR LOWER(category) LIKE ?
         ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
        [query, query, limit, offset],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }

  searchIssuesCount(searchTerm) {
    return new Promise((resolve, reject) => {
      const query = '%' + searchTerm.toLowerCase() + '%';
      this.db.get(
        `SELECT COUNT(*) as count FROM issues
         WHERE LOWER(issue) LIKE ? OR LOWER(category) LIKE ?`,
        [query, query],
        (err, row) => {
          if (err) reject(err);
          else resolve(row?.count || 0);
        }
      );
    });
  }

  getIssuesByBoundingBox(minLat, maxLat, minLng, maxLng, limit = 500, offset = 0) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM issues
         WHERE latitude >= ? AND latitude <= ?
         AND longitude >= ? AND longitude <= ?
         ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
        [minLat, maxLat, minLng, maxLng, limit, offset],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }

  // ============================================================
  // Statistics
  // ============================================================

  getStatistics(forceRefresh = false) {
    return new Promise((resolve, reject) => {
      const now = Date.now();

      // Return cached data if fresh
      if (!forceRefresh && this.cache.statistics && (now - this.cache.lastCacheTime) < this.CACHE_DURATION) {
        resolve(this.cache.statistics);
        return;
      }

      this.db.all(
        `SELECT
           COUNT(*) as total,
           SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as openCount,
           SUM(CASE WHEN status = 'in-progress' THEN 1 ELSE 0 END) as inProgressCount,
           SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolvedCount
         FROM issues`,
        (err, rows) => {
          if (err) reject(err);
          else {
            const stats = rows[0] || {
              total: 0,
              openCount: 0,
              inProgressCount: 0,
              resolvedCount: 0
            };
            this.cache.statistics = stats;
            this.cache.lastCacheTime = now;
            resolve(stats);
          }
        }
      );
    });
  }

  getCategoryStats(forceRefresh = false) {
    return new Promise((resolve, reject) => {
      const now = Date.now();

      // Return cached data if fresh
      if (!forceRefresh && this.cache.categoryStats && (now - this.cache.lastCacheTime) < this.CACHE_DURATION) {
        resolve(this.cache.categoryStats);
        return;
      }

      this.db.all(
        `SELECT category, COUNT(*) as count
         FROM issues
         GROUP BY category
         ORDER BY count DESC`,
        (err, rows) => {
          if (err) reject(err);
          else {
            const stats = {};
            rows.forEach((row) => {
              stats[row.category] = row.count;
            });
            this.cache.categoryStats = stats;
            this.cache.lastCacheTime = now;
            resolve(stats);
          }
        }
      );
    });
  }

  invalidateCache() {
    this.cache = {
      statistics: null,
      categoryStats: null,
      lastCacheTime: 0
    };
  }

  // ============================================================
  // Comments
  // ============================================================

  addComment(issueId, comment) {
    return new Promise((resolve, reject) => {
      const id =
        Date.now().toString(36) + Math.random().toString(36).substr(2);
      const createdAt = new Date().toISOString();

      const stmt = this.db.prepare(
        `INSERT INTO comments (id, issueId, text, createdAt) VALUES (?, ?, ?, ?)`
      );

      stmt.run(id, issueId, comment, createdAt, (err) => {
        stmt.finalize();
        if (err) reject(err);
        else resolve({ id, issueId, text: comment, createdAt });
      });
    });
  }

  getComments(issueId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM comments WHERE issueId = ? ORDER BY createdAt ASC',
        [issueId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }

  // ============================================================
  // Cleanup
  // ============================================================

  close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      } else {
        resolve();
      }
    });
  }

  // Clear all data (for testing/reset)
  clearAll() {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run('DELETE FROM comments', (err) => {
          if (err) reject(err);
        });
        this.db.run('DELETE FROM issues', (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    });
  }
}

module.exports = Database;
