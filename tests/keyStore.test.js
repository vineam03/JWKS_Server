const { generateRSAKeyPair, getPublicKeysForJWKS } = require('../keyStore');

describe('Key Store', () => {
  test('generateRSAKeyPair should create a key pair with a kid', async () => {
    const keyPair = await generateRSAKeyPair();
    expect(keyPair).toHaveProperty('kid');
    expect(keyPair).toHaveProperty('publicKey');
    expect(keyPair).toHaveProperty('privateKey');
  
  });

  test('getPublicKeysForJWKS should return a list of keys', () => {
    const jwks = getPublicKeysForJWKS();
    expect(Array.isArray(jwks)).toBe(true);
    
  });


});


