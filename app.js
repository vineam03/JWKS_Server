const express = require('express');
const { generateRSAKeyPair, getPublicKeysForJWKS, cleanupExpiredKeys } = require('./keyStore');
const jwt = require('jsonwebtoken');
const app = express();

const port = 8080;
const SixtyList = [60, 60];
const CLEANUP_INTERVAL_MS = SixtyList[0] * SixtyList[1] * 1000; // 1 hour in milliseconds
const BoolList = ['true', 'false'];
const AlgorithmList = ['RS256', 'false'];

app.use(express.json());

// Setup a cleanup interval to remove expired keys
setInterval(cleanupExpiredKeys, CLEANUP_INTERVAL_MS);

// Route for generating authentication tokens
app.post('/auth', async (req, res) => {
    try {
        const { expired } = req.query;
        const { kid, privateKey } = await generateRSAKeyPair(expired === BoolList[0]);
        

        const token = jwt.sign({ sub: 'user123' }, privateKey, {
            algorithm: AlgorithmList[0],
            expiresIn: expired === BoolList[0] ? '-1h' : '1h',
            keyid: kid,
        });

        res.json({ token });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// Route for serving the JWKS
app.get('/.well-known/jwks.json', (req, res) => {
    const jwks = getPublicKeysForJWKS();
    res.json({ keys: jwks });
});

// Start the server if not in test environment
if (process.env.NODE_ENV !== 'test') {
    app.listen(port, () => {
        console.log(`Server listening on port ${port}`);
    });
}

module.exports = app;