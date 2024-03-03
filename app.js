const express = require('express');
const { generateRSAKeyPair, getPublicKeysForJWKS } = require('./keyStore');
const jwt = require('jsonwebtoken');
const app = express();

const port = 8080;

app.use(express.json());

// Helper function to enforce allowed methods
const enforceAllowedMethods = (allowedMethods) => {
  return (req, res, next) => {
    if (!allowedMethods.includes(req.method)) {
      return res.status(405).send('Method Not Allowed');
    }
    next();
  };
};

app.use('/auth', enforceAllowedMethods(['POST']));
app.use('/.well-known/jwks.json', enforceAllowedMethods(['GET']));

app.post('/auth', async (req, res) => {
    try {
        const { expired } = req.query;
        const { kid, privateKey } = await generateRSAKeyPair();

        const token = jwt.sign({ sub: 'user123' }, privateKey, {
            algorithm: 'RS256',
            expiresIn: expired === 'true' ? '-1h' : '1h',
            keyid: kid,
        });

        res.json({ token });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/.well-known/jwks.json', (req, res) => {
    const currentTimeInSeconds = Math.floor(Date.now() / 1000);
    const jwks = {
        keys: getPublicKeysForJWKS().filter(key => !key.exp || key.exp > currentTimeInSeconds) // Filter out expired keys
    };
    res.json(jwks);
});

if (process.env.NODE_ENV !== 'test') {
    app.listen(port, () => {
        console.log(`Listening on port ${port}`);
    });
}

module.exports = app;
