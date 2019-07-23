var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const User = require(__dirname + '/../../app/models/user');
const NickName = require(__dirname + ' /../../app/models/nickname');
const seeder = require('mongoose-seed');
const faker = require('faker');
const config = require(__dirname + '/../../config');

new Promise(resolve => {
  mongoose.connect(config.db, {
    useNewUrlParser: true,
    promiseLibrary: require('bluebird'),
  });
  User.find({}, { _id: 1 }).exec((err, user_ids) => {
    resolve(user_ids);
    mongoose.connection.close();
  });
}).then(users => {
  return new Promise(resolve => {
    let item = [];
    for (i = 0; i < users.length - 1; i++) {
      let owner = users[i]._id;
      for (j = i + 1; j < users.length; j++) {
        item.push({
          owner,
          user_id: users[j]._id,
          nick_name: faker.lorem.word(),
          room_id: null,
        });
      }
    }
    resolve(item);
  }).then(item => {
    seeder.connect(config.db, function () {
      let data = [
        {
          model: 'NickName',
          documents: item,
        },
      ];
      seeder.loadModels([__dirname + '/../../app/models/nickname']);
      seeder.clearModels(['NickName'], function () {
        seeder.populateModels(data, function () {
          seeder.disconnect();
        });
      });
    });
  });
});
