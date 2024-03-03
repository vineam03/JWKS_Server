/*
Name: Vin Eamboriboon
Section/Course: CSCE 3550.002
Date: 3/2/2024
Description: Key Generator
*/


//Inclusion of the crypto library
const crypto = require('crypto');

// Storage for RSA keys
let keys = [];

// A key is generated via this function, with expiry included
function generateRSAKeyPair(expireImmediately = false) {
    return new Promise((resolve, reject) => {
        crypto.generateKeyPair('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
        }, (err, publicKey, privateKey) => {
            if (err) reject(err);

            const kid = crypto.randomBytes(16).toString('hex');
            const exp = Date.now() + (expireImmediately ? -1000 : 3600000); // 1 hour in ms
            const keyPair = { kid, publicKey, privateKey, alg: 'RS256', exp };
            keys.push(keyPair);
            resolve(keyPair);
        });
    });
}

// Returns the public keys in JWKS format, excluding any that are expired
function getPublicKeysForJWKS() {
    const now = Date.now();
    return keys
        .filter(key => key.exp > now)
        .map(({ kid, publicKey, alg }) => {
            const { n, e } = crypto.createPublicKey(publicKey).export({ format: 'jwk' });
            return {
                kty: 'RSA',
                kid,
                alg,
                use: 'sig',
                n: base64url(n), // modulus
                e: base64url(e)  // exponent
            };
        });
}

// Cleanup expired keys
function cleanupExpiredKeys() {
    const now = Date.now();
    keys = keys.filter(key => key.exp > now);
}

// Base64 URL encode a buffer
function base64url(buffer) {
    return buffer.toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

module.exports = { generateRSAKeyPair, getPublicKeysForJWKS, cleanupExpiredKeys };