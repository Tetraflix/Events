const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/events');

const db = mongoose.connection;

db.on('error', () => {
  console.log('Error connecting to the server');
});

db.once('open', () => {
  console.log('Database connection successful');
  // End of db open callback
});
