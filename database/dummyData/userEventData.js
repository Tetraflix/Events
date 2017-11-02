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
const dashboard = require('../../dashboard/index.js');

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

const generateSession = () => {
  const sessionObj = {
    id: Math.floor(Math.random() * 10000000) + 1,
    userId: Math.floor(Math.random() * 10000000),
    groupId: Math.floor(Math.random() * 2) + 1,
  };
  return sessionObj;
};

const generateFirstQuery = () => {
  const query = {
    eventId: 1,
    movieObj: generateMovieObj(),
    value: Math.random(),
  };
  return query;
};

const generateEvent = (prevEvent = null) => {
  if (!prevEvent) {
    // User is logging in to a new session
    return {
      session: generateSession(),
      query: generateFirstQuery(),
    };
  }
  const { eventId } = prevEvent.query;
  let newEventId = null;
  let newMovieObj = null;
  if (eventId === 1) {
    // User has already logged in
    // 95% chance of watching a movie, 5% of logging out
    newEventId = Math.random() < 0.05 ? 4 : 2;
  } else if (eventId === 2) {
    // User is watching a movie
    // 80% chance of stopping movie, 20% of logging out directly
    newEventId = Math.random() < 0.8 ? 3 : 4;
  } else {
    // User has stopped watching a movie
    // 50% chance of starting a new movie, 50% of logging out
    newEventId = Math.random() < 0.5 ? 2 : 4;
    if (newEventId === 2) {
      newMovieObj = generateMovieObj();
    }
  }
  return {
    session: prevEvent.session,
    query: {
      eventId: newEventId,
      movieObj: newMovieObj === null ? prevEvent.query.movieObj : newMovieObj,
      isRec: newMovieObj === null ? prevEvent.query.isRec : Math.round(Math.random()) === 0,
      value: Math.random(), // Refine and refactor
    },
  };
};

const generateUserSession = () => {
  const userSession = [];
  let event = generateEvent();
  userSession.push(event);
  while (event.query.eventId !== 4) {
    event = generateEvent(event);
    userSession.push(event);
  }
  return userSession;
};

const generateAllSessions = (num) => {
  const totalSessions = [];
  for (let i = 0; i < num; i += 1) {
    totalSessions.push(generateUserSession());
  }
  return totalSessions;
};

const simulateUserEvents = (numOfSessions) => {
  const totalSessions = generateAllSessions(numOfSessions);
  // holds all of the events, in chronological order, that will be added to the database
  const eventArray = [];
  while (totalSessions.length > 0) {
    const randIndex = Math.floor(Math.random() * totalSessions.length);
    eventArray.push(totalSessions[randIndex].shift());
    if (totalSessions[randIndex].length === 0) {
      totalSessions.splice(randIndex, 1);
    }
  }
  return eventArray;
};

const eventArray = simulateUserEvents(20);
const eventDashboard = [];

const generateEvents = (num = 1) => {
  const event = eventArray[num - 1];
  if (num <= eventArray.length) {
    db.addEvent(event.session, event.query)
      .then(() => {
        eventDashboard.push({
          update: {
            _index: 'user_events',
            _type: 'event',
            _id: event.session.id,
          },
        });
        eventDashboard.push({
          script: {
            source: 'ctx._source.events.add(params.eventQ)',
            lang: 'painless',
            params: {
              eventQ: event.query,
            },
          },
          upsert: {
            session: event.session,
            events: [event.query],
          },
        });
        generateEvents(num + 1);
      })
      .catch(() => {
        console.log('Error generating events');
      });
  } else {
    dashboard.elasticCreate(eventDashboard);
  }
};

module.exports = generateEvents;
