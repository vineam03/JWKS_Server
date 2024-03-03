const crypto = require('crypto');

// In-memory storage for RSA keys
let keys = [];

// This function generates an RSA key pair and stores it with an expiration time
function generateRSAKeyPair(expireImmediately = false) {
    return new Promise((resolve, reject) => {
        crypto.generateKeyPair('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem'
            }
        }, (err, publicKey, privateKey) => {
            if (err) {
                reject(err);
            } else {
                const kid = crypto.randomBytes(16).toString('hex');
                // Set the key expiration to 1 hour from now or immediately if requested
                const exp = expireImmediately ? Date.now() - 1000 : Date.now() + (60 * 60 * 1000);
                const keyPair = { kid, publicKey, privateKey, alg: 'RS256', exp: exp };
                keys.push(keyPair);
                resolve(keyPair);
            }
        });
    });
}

// This function returns the public keys in JWKS format, excluding any that are expired
function getPublicKeysForJWKS() {
    // Get the current time
    const now = Date.now();
    // Filter out keys that have expired
    return keys.filter(key => key.exp > now).map(({ kid, publicKey, alg }) => {
        // Convert the public key to JWK format
        const jwk = crypto.createPublicKey(publicKey).export({ format: 'jwk' });

        // Return the JWK with proper Base64 URL encoding
        return {
            kty: jwk.kty,
            kid,
            alg,
            use: 'sig',
            n: base64url(jwk.n), // The modulus
            e: base64url(jwk.e), // The exponent
        };
    });
}

// This helper function encodes input in Base64 URL format
function base64url(input) {
    return input.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Exports the functions for use in other modules
module.exports = { generateRSAKeyPair, getPublicKeysForJWKS };