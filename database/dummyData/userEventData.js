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

const generateSession = () => {
  const sessionObj = {
    id: Math.floor(Math.random() * 10000000),
    userId: Math.floor(Math.random() * 10000000),
    groupId: Math.floor(Math.random() * 2) + 1,
  };
  return sessionObj;
};

const generateMovieProfile = () => {
  const profileValues = [];
  let genreSum = 0;
  for (let i = 0; i < 15; i += 1) {
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
    isRec: Math.floor(Math.random() * 2),
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

const generateEvent = () => {
  const event = {
    session: generateSession(),
    query: generateQuery(),
  };
  return event;
};
