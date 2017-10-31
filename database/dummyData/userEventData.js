/*

*** FORMAT OF INPUT ***

{
  session: {
    id: 12345678909,
    userId: 123456789098,
    groupId: 1
  },
  query: {
    eventId: 2,
    movieObj: {
      id: 543,
      profile: {
        'action': 100,
        'animation': 0,
        'comedy': 0,
        'documentary': 0,
        'drama': 0,
        'family': 0,
        'fantasy': 0,
        'horror': 0,
        'international': 0,
        'musical': 0,
        'mystery': 0,
        'romance': 0,
        'sci_fi': 0,
        'thriller': 0,
        'western': 0
      },
      isRec: true
    }
    value: 0.5
  }
}

potential eventIds: 1->login, 2->watch, 3->stop watching, 4->logout

*/

const db = require('../index.js');

const generateSession = () => {
  const sessionObj = {
    id: Math.floor(Math.random() * 10000000) + 1,
    userId: Math.floor(Math.random() * 10000000),
    groupId: Math.floor(Math.random() * 2) + 1,
  };
  return sessionObj;
};

const generateMovieProfile = () => {
  const profileValues = [];
  let genreSum = 0;
  for (let i = 0; i < 14; i += 1) {
    const genreVal = Math.floor(Math.random() * 100);
    genreSum += genreVal;
    profileValues.push(genreVal);
  }
  const genreRatio = 100 / genreSum;
  let newGenreSum = 0;
  profileValues.forEach((value, index) => {
    const newGenreVal = Math.floor(profileValues[index] * genreRatio);
    newGenreSum += newGenreVal;
    profileValues[index] = newGenreVal;
  });
  profileValues.push(100 - newGenreSum);

  const profile = {
    action: 0,
    animation: 0,
    comedy: 0,
    documentary: 0,
    drama: 0,
    family: 0,
    fantasy: 0,
    horror: 0,
    international: 0,
    musical: 0,
    mystery: 0,
    romance: 0,
    sci_fi: 0,
    thriller: 0,
    western: 0,
  };
  const profileKeys = Object.keys(profile);
  profileKeys.forEach((value, index) => {
    profile[value] = profileValues[index];
  });
  return profile;
};

const generateMovieObj = () => {
  const rec = Math.round(Math.random()) === 0;
  const movieObj = {
    id: Math.floor(Math.random() * 300000),
    profile: generateMovieProfile(),
    isRec: rec,
  };
  return movieObj;
};

const generateQuery = () => {
  const query = {
    eventId: Math.floor(Math.random() * 4) + 1,
    movieObj: generateMovieObj(),
    value: Math.random(),
  };
  return query;
};

/*

Tree of options for a user's session events.
login
logout || startWatching
if startWatching
  stopWatching || logout
  if stopWatching
    logout || startWatching
  if logout
    session ends

*/

const generateEvents = (num) => {
  const eventArray = [];
  for (let i = 0; i < num; i += 1) {
    const event = {
      session: generateSession(),
      query: generateQuery(),
    };
    eventArray.push(event);
  }
  eventArray.map(event => db.addEvent(event.session, event.query));
  return Promise.all(eventArray);
};

// Must be populated with sub arrays containing events for a session.
const totalSessions = [];

while (totalSessions.length > 0) {
  // holds all of the events, in chronological order, that will be added to the database
  const eventArray = [];
  const randIndex = Math.floor(Math.random() * totalSessions.length);
  eventArray.push(totalSessions[randIndex].shift());
  if (totalSessions[randIndex].length === 0) {
    totalSessions.splice(randIndex, 1);
  }
}

module.exports = generateEvents;
