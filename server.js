// server.js

const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Path to the database file
const dbPath = path.resolve(__dirname, 'totally_not_my_privateKeys.db');
// Ensure the database file exists
fs.closeSync(fs.openSync(dbPath, 'a'));

const app = express();
const port = 8080;

// Open the database
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error("Database connection error:", err.message);
  } else {
    console.log('Connected to the SQLite database.');
    initializeDatabase(); // Ensure the database is initialized with the table
  }
});

function initializeDatabase() {
  db.run(`CREATE TABLE IF NOT EXISTS keys (
    kid TEXT PRIMARY KEY,
    publicKey TEXT NOT NULL,
    privateKey TEXT NOT NULL,
    alg TEXT NOT NULL,
    exp INTEGER NOT NULL
  )`, (err) => {
    if (err) {
      console.error('Error creating table:', err.message);
    }
  });
}

app.use(express.json());

// Helper function for base64url encoding
function base64url(input) {
  return input.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Function to generate RSA key pair and store it in the database
function generateRSAKeyPair(expireImmediately = false) {
  return new Promise((resolve, reject) => {
    crypto.generateKeyPair('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    }, (err, publicKey, privateKey) => {
      if (err) reject(err);

      const kid = crypto.randomBytes(16).toString('hex');
      const exp = Math.floor(Date.now() / 1000) + (expireImmediately ? -3600 : 3600); // 1 hour in seconds
      const alg = 'RS256';
      const keyPair = { kid, publicKey, privateKey, alg, exp };

      db.run('INSERT INTO keys (kid, publicKey, privateKey, alg, exp) VALUES (?, ?, ?, ?, ?)', 
      [kid, publicKey, privateKey, alg, exp], (err) => {
        if (err) {
          console.error('Error inserting key:', err.message);
          reject(err);
        } else {
          resolve(keyPair);
        }
      });
    });
  });
}

// Function to get all valid public keys for JWKS
function getPublicKeysForJWKS() {
  return new Promise((resolve, reject) => {
    const now = Math.floor(Date.now() / 1000);
    db.all('SELECT kid, publicKey, alg FROM keys WHERE exp > ?', [now], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        const jwks = rows.map(({ kid, publicKey, alg }) => {
          const publicKeyObj = crypto.createPublicKey(publicKey);
          const jwk = publicKeyObj.export({ type: 'spki', format: 'jwk' });
          return {
            kty: jwk.kty,
            kid: kid,
            alg: alg,
            use: 'sig',
            n: base64url(jwk.n), // Convert to base64url
            e: base64url(jwk.e),
          };
        });
        console.log('Public keys for JWKS:', jwks);
        resolve(jwks);
      }
    });
  });
}

// Cleanup function for expired keys
function cleanupExpiredKeys() {
  const now = Math.floor(Date.now() / 1000);
  db.run('DELETE FROM keys WHERE exp <= ?', [now], (err) => {
    if (err) {
      console.error('Error cleaning up expired keys:', err.message);
    } else {
      console.log('Expired keys cleaned up successfully.');
    }
  });
}

// Set a cleanup interval to remove expired keys
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour in milliseconds
setInterval(cleanupExpiredKeys, CLEANUP_INTERVAL_MS);

// POST endpoint for generating authentication tokens
app.post('/auth', async (req, res) => {
  try {
    const { expired } = req.query;
    const { kid, privateKey } = await generateRSAKeyPair(expired === 'true');
    const token = jwt.sign({ sub: 'user123' }, privateKey, {
      algorithm: 'RS256',
      expiresIn: expired === 'true' ? '-1h' : '1h',
      keyid: kid
    });

    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// GET endpoint for serving JWKS
app.get('/.well-known/jwks.json', async (req, res) => {
  try {
    const jwks = await getPublicKeysForJWKS();
    res.json({ keys: jwks });
  } catch (error) {
    console.error('Error serving JWKS:', error);
    res.status(500).send('Internal server error');
  }
});

// Start the server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

module.exports = { app, generateRSAKeyPair, getPublicKeysForJWKS, cleanupExpiredKeys };

