const chai = require('chai');

const chaiHttp = require('chai-http');

const db = require('../database/index.js');

const should = chai.should();


chai.use(chaiHttp);

describe('Events Data', () => {
  it('Should create a user event entry', (done) => {
    chai.request('http://localhost:3000')
      .post('/')
      .send({
        session: {
          id: 3284346,
          userId: 534356757834,
          groupId: 1,
        },
        query: {
          eventId: 5,
          movieObj: {
            id: 545,
            profile: {
              action: 87,
              comedy: 15,
              drama: 2,
              western: 1,
            },
            isRec: true,
          },
          value: 0.5,
        },
      })
      .end((err, res) => {
        res.should.have.status(201);
        res.body.should.be.a('object');
        done();
      });
  });
  it('Should contain a movie profile for session events', () => {
    db.selectSessionEvents(6156376, (err, result) => {
      if (err) {
        throw err;
      }
      result.events[0].movieObj.profile.should.be.a('object');
    });
  });
  it('Should contain an array of events for a session', () => {
    db.selectSessionEvents(4169637, (err, result) => {
      if (err) {
        throw err;
      }
      result.events.should.be.a('array');
    });
  });
  
}).timeout(60000);
