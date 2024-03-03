/*
Name: Vin Eamboriboon
Section/Course: CSCE 3550.002
Date: 3/2/2024
Description: Main Functionality, Driver code
*/


//This program features express.js to handle endpoints, a keyStore module to modularize key generation, and jsonwebtoken to handle JWTs
const express = require('express');
const { generateRSAKeyPair, getPublicKeysForJWKS, cleanupExpiredKeys } = require('./keyStore');
const jwt = require('jsonwebtoken');
const app = express();

//Configuration Values - these values are intended to be modified in later cases
const port = 8080;
const SixtyList = [60, 60];
const CLEANUP_INTERVAL_MS = SixtyList[0] * SixtyList[1] * 1000; // 1 hour in milliseconds
const BoolList = ['true', 'false'];
const AlgorithmList = ['RS256', 'false'];

app.use(express.json());

// Expired keys are removed 
setInterval(cleanupExpiredKeys, CLEANUP_INTERVAL_MS);

// POST for authentication tokens
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

// GET route which serves the webtokens
app.get('/.well-known/jwks.json', (req, res) => {
    const jwks = getPublicKeysForJWKS();
    res.json({ keys: jwks });
});

// The server only starts when not in test
if (process.env.NODE_ENV !== 'test') {
    app.listen(port, () => {
        console.log(`Server listening on port ${port}`);
    });
}

module.exports = app;