const elasticsearch = require('elasticsearch');

const client = new elasticsearch.Client({
  host: 'localhost:9200',
});

client.ping({
  requestTimeout: 30000,
}, (error) => {
  if (error) {
    console.error('elasticsearch cluster is down!');
  } else {
    console.log('All is well');
  }
});

const elasticCreate = ((eventArr) => {
  client.bulk({
    body: [
      {
        index: {
          _index: 'user_events',
          _type: 'event',
        },
      },
      eventArr,
    ],
  })
    .then((res) => {
      console.log('Bulk insertion successful with response:', res.items[0].index.error);
    })
    .catch((err) => {
      console.error('Error creating document', err);
    });
});

module.exports.elasticCreate = elasticCreate;
