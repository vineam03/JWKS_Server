const sqlite3 = require('sqlite3');
const path = require('path');

// Path to the database file
const dbPath = path.resolve(__dirname, 'totally_not_my_privateKeys.db');

// Increase Jest's default timeout for each test
jest.setTimeout(10000); // Timeout of 10 seconds

describe('SQLite Database', () => {
  let db;

  // Runs before all tests
  beforeAll(done => {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error("Database connection error:", err.message);
        done(err);
        return;
      }
      // Create the table schema
      db.run(`
        CREATE TABLE IF NOT EXISTS keys (
          kid INTEGER PRIMARY KEY AUTOINCREMENT,
          key BLOB NOT NULL,
          exp INTEGER NOT NULL
        )
      `, (err) => {
        if (err) {
          console.error("Error creating table:", err.message);
        }
        done(err);
      });
    });
  });

  // Runs after all tests
  afterAll(done => {
    db.close(done);
  });

  test('should have the correct table schema', done => {
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='keys'", (err, row) => {
      expect(err).toBeNull();
      expect(row).toBeDefined();
      expect(row.name).toBe('keys');
      done();
    });
  });

  // Add other tests here if needed
});

