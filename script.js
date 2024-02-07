//This line starts off by incorporating express
const express = require('express');
//An instantiation of express, assigned to object app. This is a common practice when using express
const app = new express();
//Default to port 5000, we will use this variable later
const port = 5000

app.listen(port, () => {
  console.log('Listening on port number ${port}');
});



