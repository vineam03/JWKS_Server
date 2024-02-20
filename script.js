//This line starts off by incorporating express, jest, jsonwebtoken, and crypto
const express = require('express');
const crypto = require('crypto'); // Crypto is built in
// const { generateKeyPair } = require('crypto') // This is another way to import just the function
const jest = require('jest');
const jwt = require('jsonwebtoken');

class TestClass{
  constructor(id, num){
    this.TestClassID = id;
    this.TestClassNum = num; 
  }
}

//An instantiation of express, assigned to object app. This is a common practice when using express
const app = new express();
//Default to port 8080, we will use this variable later
const port = 8080

//RSA Key Pair Generation
async function generateRSAKeyPair() {





  
}







app.listen(port, () => {
  console.log(`Listening on port number ${port}`);
});

//API Endpoint I - POST REQUESTS are handled here
app.post('/auth', (req, res) => {
  console.log("Intiate JWKS Scanning Process...");
})


