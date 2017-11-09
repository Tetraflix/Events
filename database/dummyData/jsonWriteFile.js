const fs = require('fs');

const buildFile = (eventArr) => {
  // const obj = {
  //   table: eventArr,
  // };
  const sessions = {};
  for (let i = 0; i < eventArr.length; i += 1) {
    const event = eventArr[i];
    if (event.session.id in sessions) {
      sessions[event.session.id].events.push(event.query);
    } else {
      sessions[event.session.id] = {
        _id: event.session.id,
        userId: event.session.userId,
        groupId: event.session.groupId,
        events: [event.query],
      };
    }
  }
  const sessionsArray = [];
  for (let key in sessions) {
    sessionsArray.push(sessions[key]);
  }
  // console.log('sessions array:', sessionsArray);
  const wstream = fs.createWriteStream('eventJson.json');
  wstream.write('[');
  for (let i = 0; i < sessionsArray.length; i += 1) {
    wstream.write(JSON.stringify(sessionsArray[i]) + ',');
  }
  wstream.end();
  console.log('Write stream complete');
};

module.exports = buildFile;
