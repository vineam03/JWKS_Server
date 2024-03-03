/*
Name: Vin Eamboriboon
Section/Course: CSCE 3550.002
Date: 3/2/2024
Description: Test suite for keyStore.js
*/

const { generateRSAKeyPair, getPublicKeysForJWKS } = require('../keyStore');


//This test will ensure proper functionality within key store module
describe('Key Store', () => {
  
  //The functionality should return some key pair
  test('generateRSAKeyPair should create a key pair with a kid', async () => {
    const keyPair = await generateRSAKeyPair();
    expect(keyPair).toHaveProperty('kid');
    expect(keyPair).toHaveProperty('publicKey');
    expect(keyPair).toHaveProperty('privateKey');
  
  });

  //A list of keys should be returned
  test('getPublicKeysForJWKS should return a list of keys', () => {
    const jwks = getPublicKeysForJWKS();
    expect(Array.isArray(jwks)).toBe(true);
    
  });


});


