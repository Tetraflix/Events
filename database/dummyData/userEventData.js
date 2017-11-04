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
    progress: 0.5
  }
}

potential eventIds: 1->login, 2->watch, 3->stop watching, 4->logout

*/

const db = require('../index.js');
const dashboard = require('../../dashboard/index.js');
const request = require('request');

const generateSession = () => {
  const sessionObj = {
    id: Math.floor(Math.random() * 10000000) + 1,
    userId: Math.floor(Math.random() * 10000000),
    groupId: Math.floor(Math.random() * 2),
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
  const movieObj = {
    id: Math.floor(Math.random() * 300000),
    profile: generateMovieProfile(),
    isRec: Math.round(Math.random()) === 0,
  };
  return movieObj;
};

const generateFirstQuery = () => {
  const query = {
    eventId: 1,
    movieObj: null,
    progress: null,
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
  let newMovieProgress = null;
  if (eventId === 1) {
    // User has already logged in
    // 95% chance of watching a movie, 5% of logging out
    newEventId = Math.random() < 0.05 ? 4 : 2;
    // User is starting a new movie
    if (newEventId === 2) {
      // Generate new movie for user to watch
      newMovieObj = generateMovieObj();
      // 75% chance that it is a completely new movie, 25% that it is a 'resume watch'
      newMovieProgress = Math.random() < 0.75 ? 0 : Math.random() * 0.8;
    }
  } else if (eventId === 2) {
    // User is watching a movie
    // 80% chance of stopping movie, 20% of logging out directly
    newEventId = Math.random() < 0.8 ? 3 : 4;
    const newProgress = Math.random() * 3;
    // Greater chance of them finishing movie than stopping in the middle
    newMovieProgress = newProgress > 0.8 ? 1 : newProgress;
  } else if (eventId === 3) {
    // User has stopped a movie
    // 50% chance of starting a new movie, 50% of logging out
    newEventId = Math.random() < 0.5 ? 2 : 4;
    // Starting a new movie
    if (newEventId === 2) {
      newMovieProgress = Math.random() < 0.75 ? 0 : Math.random() * 0.8;
      newMovieObj = generateMovieObj();
    }
  } else {
    // User has logged out, end of session
    newMovieProgress = null;
    newMovieObj = null;
  }
  // console.log('For event with id', newEventId, 'newMovieProgress is', newMovieProgress);
  return {
    session: prevEvent.session,
    query: {
      eventId: newEventId,
      movieObj: newMovieObj === null ? prevEvent.query.movieObj : newMovieObj,
      isRec: newMovieObj === null ? prevEvent.query.isRec : Math.round(Math.random()) === 0,
      progress: newMovieProgress,
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
  // If user logs out directly from watching a movie, create a stop event and insert before logout
  const preLogoutEvent = userSession[userSession.length - 2];
  if (preLogoutEvent.query.eventId === 2) {
    const insertEvent = {
      session: preLogoutEvent.session,
      query: {
        eventId: 3,
        movieObj: preLogoutEvent.query.movieObj,
        isRec: preLogoutEvent.query.isRec,
        progress: preLogoutEvent.query.progress * 2 > 0.9 ? 1 : preLogoutEvent.query.progress * 2,
      },
    };
    userSession.splice(userSession.length - 1, 0, insertEvent);
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

let eventArray = simulateUserEvents(100);
let eventDashboard = [];

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
      // If the event just added to DB has id == 4, grab all assiociated session data
      .then(() => {
        if (event.query.eventId === 4) {
          request.get(`http://localhost:3000/${event.session.id}`, (err, res, body) => {
            if (err) throw err;
            const parsedBody = JSON.parse(body);
            const msg1 = {
              userId: parsedBody.userId,
              groupId: parsedBody.groupId,
              events: parsedBody.events.reduce((prev, curr) => {
                return curr.eventId === 3 ?
                  prev.concat({
                    movie: {
                      id: curr.movieObj.id,
                      profile: curr.movieObj.profile,
                    },
                    progress: curr.progress,
                    startTime: new Date(),
                  })
                  : prev;
              }, []),
            };
            // console.log('Message 1 for bus:', msg1);
            const msg2 = {
              userId: parsedBody.userId,
              groupId: parsedBody.groupId,
              recs: parsedBody.events.reduce((prev, curr) => {
                return curr.eventId === 3 && curr.movieObj.isRec === true && curr.progress === 1 ?
                  prev + curr.progress : prev;
              }, 0),
              nonRecs: parsedBody.events.reduce((prev, curr) => {
                return curr.eventId === 3 && curr.movieObj.isRec === false && curr.progress === 1 ?
                  prev + curr.progress : prev;
              }, 0),
            };
            // console.log('Message 2 for bus:', msg2);
            const msg3 = {
              userId: parsedBody.userId,
              // { movie: {id}, progress, startTime/endTime? }
              events: parsedBody.events.reduce((prev, curr) => {
                return curr.eventId === 3 ?
                  prev.concat({
                    movie: { id: curr.movieObj.id },
                    progress: curr.progress,
                    startTime: new Date(),
                  })
                  : prev;
              }, []),
            };
            // console.log('Message 3 for bus:', msg3);
          });
        }
      })
      .catch(() => {
        console.log('Error generating events');
      });
  } else {
    dashboard.elasticCreate(eventDashboard);
    eventArray = simulateUserEvents(100);
    eventDashboard = [];
  }
};

module.exports = generateEvents;
