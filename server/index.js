const express = require('express');
const bodyParser = require('body-parser');
const db = require('../database');
const generateEvents = require('../database/dummyData/userEventData.js');

const app = express();
app.use(bodyParser.json());

app.get('/', (req, res) => {
  // db.selectAllEvents((err, data) => {
  //   if (err) {
  //     res.sendStatus(500);
  //   } else {
  //     res.status(200).send(data);
  //   }
  // });
  db.selectAllEvents()
    .then((data) => {
      res.status(200).send(data);
    })
    .catch(() => {
      res.sendStatus(500);
    });
});

app.get('/userEventData', (req, res) => {
  generateEvents(20000)
    .then(() => {
      res.sendStatus(200);
    })
    .catch(() => {
      res.sendStatus(500);
    });
});

app.get('/:session', (req, res) => {
  // db.selectSessionEvents(req.params.session, (err, data) => {
  //   if (err) {
  //     res.sendStatus(500);
  //   } else {
  //     res.status(200).send(data);
  //   }
  // });
  db.selectSessionEvents(req.params.session)
    .then((data) => {
      res.status(200).send(data);
    })
    .catch(() => {
      res.sendStatus(500);
    });
});

app.post('/', (req, res) => {
  // db.addEvent(req.body.session, req.body.query);
  // res.sendStatus(201);
  db.addEvent(req.body.session, req.body.query)
    .then(() => {
      res.sendStatus(201);
    })
    .catch(() => {
      res.sendStatus(500);
    });
});


app.listen(3000, () => {
  console.log('Listening on port 3000');
});
