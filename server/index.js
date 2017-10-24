const express = require('express');
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.status(200).send('Hello, World!');
});

app.post('/', (req, res) => {
  res.status(201).send(req.body);
});

app.listen(3000, () => {
  console.log('Listening on port 3000');
});
