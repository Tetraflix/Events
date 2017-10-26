const express = require('express');
const bodyParser = require('body-parser');
const db = require('../database');
const generateEvents = require('../database/dummyData/userEventData.js');

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

app.get('/userEventData', (req, res) => {
  generateEvents(20000);
  res.sendStatus(200);
});

app.get('/:session', (req, res) => {
  db.selectSessionEvents(req.params.session, (err, data) => {
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
