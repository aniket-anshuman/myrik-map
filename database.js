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
        // Create issues table
        this.db.run(
          `
          CREATE TABLE IF NOT EXISTS issues (
            id TEXT PRIMARY KEY,
            issue TEXT NOT NULL,
            category TEXT NOT NULL,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            status TEXT DEFAULT 'open',
            imageData TEXT,
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
            else resolve();
          }
        );
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
        status,
        imageData,
        imageName,
        createdAt
      } = issue;

      const stmt = this.db.prepare(
        `INSERT INTO issues
         (id, issue, category, latitude, longitude, status, imageData, imageName, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );

      stmt.run(
        id,
        description,
        category,
        latitude,
        longitude,
        status,
        imageData,
        imageName,
        createdAt,
        new Date().toISOString(),
        (err) => {
          stmt.finalize();
          if (err) reject(err);
          else resolve(issue);
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

  getAllIssues() {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM issues ORDER BY createdAt DESC',
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
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

  getIssuesByStatus(status) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM issues WHERE status = ? ORDER BY createdAt DESC',
        [status],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }

  getIssuesByCategory(category) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM issues WHERE category = ? ORDER BY createdAt DESC',
        [category],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }

  searchIssues(searchTerm) {
    return new Promise((resolve, reject) => {
      const query = '%' + searchTerm.toLowerCase() + '%';
      this.db.all(
        `SELECT * FROM issues
         WHERE LOWER(issue) LIKE ? OR LOWER(category) LIKE ?
         ORDER BY createdAt DESC`,
        [query, query],
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

  getStatistics() {
    return new Promise((resolve, reject) => {
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
            resolve(stats);
          }
        }
      );
    });
  }

  getCategoryStats() {
    return new Promise((resolve, reject) => {
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
            resolve(stats);
          }
        }
      );
    });
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
