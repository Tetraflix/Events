const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/events');

mongoose.Promise = global.Promise;

const db = mongoose.connection;


db.on('error', () => {
  console.log('Error connecting to the server');
});

db.once('open', () => {
  // Start of db open callback
  console.log('Database connection successful');

  const querySubSchema = mongoose.Schema({
    eventId: Number,
    movieObj: {
      id: Number,
      profile: {
        action: Number,
        animation: Number,
        comedy: Number,
        documentary: Number,
        drama: Number,
        family: Number,
        fantasy: Number,
        international: Number,
        horror: Number,
        musical: Number,
        mystery: Number,
        romance: Number,
        sci_fi: Number,
        thriller: Number,
        western: Number,
      },
      isRec: Boolean,
    },
    value: Number,
  }, { _id: false });

  const userEventsSchema = mongoose.Schema({
    _id: Number,
    userId: Number,
    groupId: Number,
    events: [querySubSchema],
  });

  const Event = mongoose.model('event', userEventsSchema);

  const selectAllEvents = () => Event.find({}).exec();

  const selectSessionEvents = ((session, callback) => {
    Event.findOne({ _id: session }, (err, item) => {
      if (err) {
        callback(err, null);
      } else {
        callback(null, item);
      }
    });
  });

  const addEvent = ((session, queryObj) => {
    Event.findByIdAndUpdate(
      session.id,
      {
        $setOnInsert: { _id: session.id, userId: session.userId, groupId: session.groupId },
        $push: { events: queryObj },
      },
      { upsert: true },
      (err, result) => {
        if (result) {
          result.save((updateError) => {
            if (err) {
              console.log('Error updating document', updateError);
            } else {
              console.log('Updated document with id:', result.id);
            }
          });
        }
      },
    );
  });

  module.exports.selectAllEvents = selectAllEvents;
  module.exports.selectSessionEvents = selectSessionEvents;
  module.exports.addEvent = addEvent;
  // End of db open callback
});
