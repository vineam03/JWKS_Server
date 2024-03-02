const express = require('express');
const { generateRSAKeyPair, getPublicKeysForJWKS } = require('./keyStore');
const jwt = require('jsonwebtoken');
const app = express();

const port = 8080;

app.use(express.json()); // Middleware to parse JSON bodies

app.post('/auth', async (req, res) => {
    try {
        const { expired } = req.query; // Check if the request asks for an expired token
        const { kid, privateKey } = await generateRSAKeyPair(); // Generate a new key pair for each token for simplicity

        const token = jwt.sign({ sub: 'user123' }, privateKey, {
            algorithm: 'RS256',
            expiresIn: expired === 'true' ? '-1h' : '1h', // Expire immediately if "expired" query param is present
            keyid: kid,
        });

        res.json({ token });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/.well-known/jwks.json', (req, res) => {
    const jwks = {
        keys: getPublicKeysForJWKS()
    };
    res.json(jwks);
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
