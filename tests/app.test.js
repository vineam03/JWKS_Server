const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app'); // Modify the path according to the actual location

describe('Express App', () => {
    test('POST /auth should respond with a JWT', async () => {
        const response = await request(app)
            .post('/auth')
            .send({}); // Add any necessary body or query parameters
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('token');
    });

    test('GET /.well-known/jwks.json should respond with JWKS', async () => {
        const response = await request(app).get('/.well-known/jwks.json');
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('keys');
        // You could add more checks to validate the structure of the keys
    });

    test('POST /auth with expired=true should respond with an expired JWT', async () => {
        const response = await request(app)
            .post('/auth?expired=true')
            .send({});
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('token');
        // Verify the token is expired
        const decodedToken = jwt.decode(response.body.token, { complete: true });
        expect(decodedToken.payload.exp).toBeLessThan(Math.floor(Date.now() / 1000));
    });

    test('GET /.well-known/jwks.json should not include expired keys', async () => {
        const response = await request(app).get('/.well-known/jwks.json');
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('keys');

        // Check that none of the keys are expired
        const currentTime = Math.floor(Date.now() / 1000);
        response.body.keys.forEach(key => {
            expect(key).toHaveProperty('kid');
            // Assuming 'exp' is included in your JWKS (which is not standard)
            if (key.exp) {
                expect(key.exp).toBeGreaterThan(currentTime);
            }
        });
    });
    

});

describe('JWKS Endpoint', () => {
    test('it should return JWKS with the correct key properties', async () => {
      const response = await request(app).get('/.well-known/jwks.json');
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('keys');
      response.body.keys.forEach(key => {
        expect(key).toHaveProperty('kty');
        expect(key).toHaveProperty('kid');
        expect(key).toHaveProperty('use');
        expect(key).toHaveProperty('alg');
        expect(key).toHaveProperty('n');
        expect(key).toHaveProperty('e');
        
      });
    });
  
    
  });
  
  describe('JWT Validation', () => {
    test('it should create a JWT with the correct format and payload', async () => {
      const response = await request(app).post('/auth').send({ /* ... */ });
      expect(response.statusCode).toBe(200);
      const token = response.body.token;
      const decoded = jwt.decode(token, { complete: true });
  
      expect(decoded).toHaveProperty('header');
      expect(decoded.header).toHaveProperty('alg', 'RS256');
      expect(decoded.header).toHaveProperty('typ', 'JWT');
  
      expect(decoded).toHaveProperty('payload');
      expect(decoded.payload).toHaveProperty('sub');
      expect(decoded.payload).toHaveProperty('exp');
      
  
      // Verify the token using the JWKS keys
      const jwksResponse = await request(app).get('/.well-known/jwks.json');
      // Implement the logic to use JWKS for verification
    });
  
    // Add more tests here to check for expired token validation, etc.
    
  });
  
test('Expired JWKS should not be served', async () => {
  
    const expiredToken = await generateExpiredTokenSomehow();
  
    // Fetch JWKS
    const jwksResponse = await request(app).get('/.well-known/jwks.json');
    expect(jwksResponse.statusCode).toBe(200);
  

    const decodedToken = jwt.decode(expiredToken, { complete: true });
    const expiredKid = decodedToken.header.kid;
    const keys = jwksResponse.body.keys;
    const foundExpiredKey = keys.some(key => key.kid === expiredKid);
  
    
    expect(foundExpiredKey).toBeFalsy();
  });


