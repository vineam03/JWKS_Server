This program sets up a server which issues out tokens.

The program is divided into these following files: 

- The app.js file imports all essential modules to include express.js, JWT, and crypto in order to generate keys. The express application is configured and it sets up a middleware to parse JSON requests. Routes are then defined with the '/auth' route handling post requests. Another important route is the '/.well-known/jwks.json' route which serves JWKS, which will aid in verifying the tokens
  
- The keyStore.js file which contains
- The app.test.js which contains
- The keyStore.test.js which contains
