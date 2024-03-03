/*
Name: Vin Eamboriboon
Section/Course: CSCE 3550.002
Date: 3/2/2024
Description: Test suite for app.js
*/


const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');


describe('Express App', () => {
    
  //This test ensures that the POST request returns a status of 200
    test('POST /auth should respond with a JWT', async () => {
        const response = await request(app)
            .post('/auth')
            .send({});
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('token');
    });
  
  //This test ensures that the GET request returns a status of 200
    test('GET /.well-known/jwks.json should respond with JWKS', async () => {
        const response = await request(app).get('/.well-known/jwks.json');
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('keys');
      
    });
  //Expired tokens should return a true
    test('POST /auth with expired=true should respond with an expired JWT', async () => {
        const response = await request(app)
            .post('/auth?expired=true')
            .send({});
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('token');
        
        const decodedToken = jwt.decode(response.body.token, { complete: true });
        expect(decodedToken.payload.exp).toBeLessThan(Math.floor(Date.now() / 1000));
    });

    test('GET /.well-known/jwks.json should not include expired keys', async () => {
        const response = await request(app).get('/.well-known/jwks.json');
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('keys');

       
        const currentTime = Math.floor(Date.now() / 1000);
        response.body.keys.forEach(key => {
            expect(key).toHaveProperty('kid');
           
            if (key.exp) {
                expect(key.exp).toBeGreaterThan(currentTime);
            }
        });
    });
    

});

//This suite deals with the JWKS endpoints
describe('JWKS Endpoint', () => {
    //This test ensures that key properties are returned correctly
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
  
  //This test ensures the paylaod is correctly formatted
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
  
 
    
  });
  
//This test ensures that expired JWKS are not served
test('Expired JWKS should not be served', async () => {
  
    const expiredToken = await generateExpiredTokenSomehow();
  
   
    const jwksResponse = await request(app).get('/.well-known/jwks.json');
    expect(jwksResponse.statusCode).toBe(200);
  

    const decodedToken = jwt.decode(expiredToken, { complete: true });
    const expiredKid = decodedToken.header.kid;
    const keys = jwksResponse.body.keys;
    const foundExpiredKey = keys.some(key => key.kid === expiredKid);
  
    
    expect(foundExpiredKey).toBeFalsy();
  });


