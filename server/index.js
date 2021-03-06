const express = require('express');
const bodyParser = require('body-parser');
const db = require('../database');
const dashboard = require('../dashboard/index.js');
const AWS = require('aws-sdk');
// const path = require('path');
const generateEvents = require('../database/dummyData/userEventData.js');

const app = express();
app.use(bodyParser.json());
AWS.config.loadFromPath('credentials/aws.json');
const sqs = new AWS.SQS({ apiVersion: '2012-11-05' });

const queues = {
  userProfiles: 'https://sqs.us-east-2.amazonaws.com/895827825453/userProfiles.fifo',
  recommendation: 'https://sqs.us-east-2.amazonaws.com/895827825453/recommendation.fifo',
  appServer: 'https://sqs.us-east-2.amazonaws.com/895827825453/appServer.fifo',
};

const sendMessages = params => (
  sqs.sendMessage(params, (err) => {
    if (err) console.log('SQS error:', err);
  })
);

app.get('/', (req, res) => {
  db.selectAllEvents()
    .then((data) => {
      res.status(200).send(data);
    })
    .catch(() => {
      res.sendStatus(500);
    });
});

app.get('/:session', (req, res) => {
  db.selectSessionEvents(req.params.session)
    .then((data) => {
      res.status(200).send(data);
    })
    .catch(() => {
      res.sendStatus(500);
    });
});

app.post('/', (req, res) => {
  db.addEvent(req.body.session, req.body.query)
    .then(() => {
      res.sendStatus(201);
    })
    .catch(() => {
      res.sendStatus(500);
    });
});

app.post('/userEventData', (req, res) => {
  generateEvents();
  res.sendStatus(201);
});

const buildUserProfilesMsg = (msgObj) => {
  return {
    userId: msgObj.userId,
    groupId: msgObj.groupId,
    events: msgObj.events.reduce((prev, curr) => {
      return curr.eventId === 3 ?
        prev.concat({
          movie: {
            id: curr.movieObj.id,
            profile: curr.movieObj.profile,
          },
          progress: curr.progress,
          startTime: new Date(curr.time - (6000000 * curr.progress)),
        })
        : prev;
    }, []),
  };
};

const buildRecommendationMsg = (msgObj) => {
  return {
    userId: msgObj.userId,
    groupId: msgObj.groupId,
    recs: msgObj.events.reduce((prev, curr) => {
      return curr.eventId === 3 && curr.movieObj.isRec === true && curr.progress === 1 ?
        prev + curr.progress : prev;
    }, 0),
    nonRecs: msgObj.events.reduce((prev, curr) => {
      return curr.eventId === 3 && curr.movieObj.isRec === false && curr.progress === 1 ?
        prev + curr.progress : prev;
    }, 0),
  };
};

const buildAppServerMsg = (msgObj) => {
  return {
    userId: msgObj.userId,
    events: msgObj.events.reduce((prev, curr) => {
      return curr.eventId === 3 ?
        prev.concat({
          movie: { id: curr.movieObj.id },
          progress: curr.progress,
          startTime: new Date(curr.time - (6000000 * curr.progress)),
        })
        : prev;
    }, []),
  };
};

let eventDashboard = [];
app.post('/newEvent', (req, res) => {
  db.addEvent(req.body.session, req.body.query)
    .then((msgObj) => {
      eventDashboard.push({
        index: {
          _index: 'user_events',
          _type: 'event',
        },
      });
      eventDashboard.push({
        sessionId: req.body.session.id,
        userId: req.body.session.userId,
        groupId: req.body.session.groupId,
        eventId: req.body.query.eventId,
        progress: req.body.query.progress,
        time: new Date(req.body.query.time),
      });
      if (req.body.query.eventId === 4) {
        dashboard.elasticCreate(eventDashboard);
        eventDashboard = [];
        sendMessages({
          MessageBody: JSON.stringify(buildUserProfilesMsg(msgObj)),
          QueueUrl: queues.userProfiles,
          MessageGroupId: 'user-profile-events',
        });
        sendMessages({
          MessageBody: JSON.stringify(buildRecommendationMsg(msgObj)),
          QueueUrl: queues.recommendation,
          MessageGroupId: 'recommendation-events',
        });
        sendMessages({
          MessageBody: JSON.stringify(buildAppServerMsg(msgObj)),
          QueueUrl: queues.appServer,
          MessageGroupId: 'app-server-events',
        });
      }
      return msgObj;
    })
    .then((data) => {
      if (data) {
        res.sendStatus(201);
      }
      return null;
    })
    .catch((err) => {
      console.log('Error adding event to database', err);
      res.sendStatus(500);
    });
});

app.listen(3000, () => {
  console.log('Listening on port 3000');
});
