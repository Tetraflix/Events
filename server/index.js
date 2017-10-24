const express = require('express');
const bodyParser = require('body-parser');
const db = require('../database');

const app = express();
app.use(bodyParser.json());

app.get('/', (req, res) => {
  db.selectAllEvents((err, data) => {
    if (err) {
      res.sendStatus(500);
    } else {
      res.status(200).send(data);
    }
  });
});

app.post('/', (req, res) => {
  db.addEvent(req.body.session, req.body.query);
  res.sendStatus(201);
});

app.listen(3000, () => {
  console.log('Listening on port 3000');
});
