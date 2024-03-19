const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./totally_not_my_privateKeys.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error(err.message);
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

function getPublicKeysForJWKS() {
    return new Promise((resolve, reject) => {
        const now = Math.floor(Date.now() / 1000);
        db.all('SELECT kid, publicKey, alg FROM keys WHERE exp > ?', [now], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                const jwks = rows.map(({ kid, publicKey, alg }) => {
                    const keyObj = crypto.createPublicKey(publicKey);
                    const jwk = keyObj.export({ type: 'spki', format: 'jwk' });
                    return {
                        kty: jwk.kty,
                        kid: kid,
                        alg: alg,
                        use: 'sig',
                        n: jwk.n, // Assume these values are already base64url
                        e: jwk.e,
                    };
                });
                resolve({ keys: jwks }); // Wrap the keys in an object
            }
        });
    });
}

function cleanupExpiredKeys() {
    const now = Math.floor(Date.now() / 1000);
    db.run('DELETE FROM keys WHERE exp <= ?', [now], (err) => {
        if (err) {
            console.error('Error cleaning up keys:', err.message);
        }
    });
}

module.exports = { generateRSAKeyPair, getPublicKeysForJWKS, cleanupExpiredKeys };
