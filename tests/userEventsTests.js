const chai = require('chai');

const chaiHttp = require('chai-http');

const should = chai.should();

const eventsDB = require('../database/index.js');

chai.use(chaiHttp);

describe('Events Data', () => {
  it('Should create 10,000 entries', (done) => {
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
}).timeout(60000);
