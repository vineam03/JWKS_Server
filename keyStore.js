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
                const keyPair = { kid, publicKey, privateKey, alg: 'RS256' };
                keys.push(keyPair); // Store the key pair
                resolve(keyPair);
            }
        });
    });
}

function getPublicKeysForJWKS() {
    return keys.map(({ kid, publicKey, alg }) => {
        const pem = publicKey.toString();
        const match = pem.match(/-----BEGIN PUBLIC KEY-----\r?\n([A-Za-z0-9+/=\r\n]+)-----END PUBLIC KEY-----/);
        if (!match) {
            throw new Error('Could not parse public key');
        }
        const pubKeyBase64 = match[1].replace(/[\r\n]+/g, '');
        const pubKeyBuffer = Buffer.from(pubKeyBase64, 'base64');
        const pubKeyComponents = crypto.KeyObject.from(pem, 'spki', { format: 'der' }).export({ format: 'jwk' });

        return {
            kty: 'RSA',
            kid,
            alg,
            use: 'sig',
            n: pubKeyComponents.n,
            e: pubKeyComponents.e,
        };
    });
}

module.exports = { generateRSAKeyPair, getPublicKeysForJWKS };
