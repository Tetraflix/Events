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
    progress: Number,
  }, { _id: false });

  const userEventsSchema = mongoose.Schema({
    _id: Number,
    userId: Number,
    groupId: Number,
    events: [querySubSchema],
  });

  const Event = mongoose.model('event', userEventsSchema);

  const selectAllEvents = () => Event.find({}).exec();

  const selectSessionEvents = session => Event.findOne({ _id: session }).exec();

  const addEvent = (sessionObj, queryObj) =>
    Event.findByIdAndUpdate(
      sessionObj.id,
      {
        $setOnInsert: {
          _id: sessionObj.id,
          userId: sessionObj.userId,
          groupId: sessionObj.groupId,
        },
        $push: { events: queryObj },
      },
      { upsert: true },
    ).exec();

  module.exports.selectAllEvents = selectAllEvents;
  module.exports.selectSessionEvents = selectSessionEvents;
  module.exports.addEvent = addEvent;
  // End of db open callback
});
