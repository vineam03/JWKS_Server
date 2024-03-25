**IMPORTANT ENSURE THAT THE GO TEST CLIENT IS IN THE SAME DIRECTORY**

This program sets up a RESTful JWKS server which issues out public keys to verfiy JWTs. 

Features include:
- Key Expiry
- Authentication Endpoint
- JWT Handler
- SQLite Handler

The program is divided into these following files: 

- The app.js file imports all essential modules to include express.js, JWT, and crypto in order to generate keys. The express application is configured and it sets up a middleware to parse JSON requests. Routes are then defined with the '/auth' route handling post requests. Another important route is the '/.well-known/jwks.json' route which serves JWKS, which will aid in verifying the tokens
  
- The keyStore.js file which contains the implementation for the key store. It generates and manages the RSA key pairs. It provides the `generateRSAKeyPair` which generates a key. In addition, it retrieves public keyes and will clean up all expired keys

- The app.test.js which contains the suite of tests for app.js

- The keyStore.test.js which contains the suite of tests for keyStore.js
