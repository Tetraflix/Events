const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/events');

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
        foreign: Number,
        horror: Number,
        musical: Number,
        mystery: Number,
        romance: Number,
        sciFi: Number,
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

  const selectAllEvents = ((callback) => {
    Event.find({}, (err, items) => {
      if (err) {
        callback(err, null);
      } else {
        callback(null, items);
      }
    });
  });

  const addEvent = ((session, query) => {
    Event.findOneAndUpdate({ _id: session.id }, { $push: { events: query } }, (err, result) => {
      if (result) {
        result.save((updateError) => {
          if (err) {
            console.log('Error updating document', updateError);
          } else {
            console.log('Updated document');
          }
        });
      } else {
        const newEvent = new Event({
          _id: session.id,
          userId: session.userId,
          groupId: session.groupId,
        });
        newEvent.events.push(query);
        newEvent.save((createError) => {
          if (createError) {
            console.log('Error saving event to database', createError);
          } else {
            console.log('Saved event to database');
          }
        });
      }
    });
  });

  module.exports.selectAllEvents = selectAllEvents;
  module.exports.addEvent = addEvent;
  // End of db open callback
});
