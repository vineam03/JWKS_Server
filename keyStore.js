const crypto = require('crypto');

let keys = []; // In-memory storage for RSA keys

function generateRSAKeyPair() {
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
            if (err) reject(err);
            else {
                const kid = crypto.randomBytes(16).toString('hex');
                // Set the expiry to 1 hour from now for simplicity
                const expiry = Date.now() + (60 * 60 * 1000); 
                const keyPair = { kid, publicKey, privateKey, alg: 'RS256', exp: expiry };
                keys.push(keyPair); // Store the key pair
                resolve(keyPair);
            }
        });
    });
}

function getPublicKeysForJWKS() {
    // Filter out expired keys
    const nonExpiredKeys = keys.filter(key => key.exp > Date.now());
    return nonExpiredKeys.map(({ kid, publicKey, alg }) => {
        const keyObj = crypto.createPublicKey(publicKey);
        const jwk = keyObj.export({ format: 'jwk' });

        return {
            kty: 'RSA',
            kid,
            alg,
            use: 'sig',
            n: base64url(jwk.n), // Ensure n is base64 URL encoded without padding
            e: base64url(jwk.e), // Ensure e is base64 URL encoded without padding
        };
    });
}

function base64url(input) {
    return input.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

module.exports = { generateRSAKeyPair, getPublicKeysForJWKS };

