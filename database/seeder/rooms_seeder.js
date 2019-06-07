var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const User = require(__dirname + '/../../app/models/user');
const Room = require(__dirname + ' /../../app/models/room');
const seeder = require('mongoose-seed');
const faker = require('faker');
const _ = require('lodash');
const config = require(__dirname + '/../../config');
const configCommon = require(__dirname + '/../../config/config');

const roomCount = 500;
const minMsgCount = 0;
const maxMsgCount = 20;
const minMemberCount = 2;

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

    for (i = 0; i < roomCount; i++) {
      let type = faker.random.number({
        min: configCommon.ROOM_TYPE.GROUP_CHAT,
        max: configCommon.ROOM_TYPE.DIRECT_CHAT,
      });
      let members = detectRoomByUsers(type, users);
      let msgCount = faker.random.number({ min: minMsgCount, max: maxMsgCount });
      let message = [];

      for (j = 0; j < msgCount; j++) {
        message.push({
          content: faker.lorem.text(),
          user: randomUserForMessage(members).user,
        });
      }

      item.push({
        name: '[ROOM] ' + faker.lorem.word(),
        desc: faker.lorem.text(),
        avatar: faker.image.avatar(),
        type: type,
        members: members,
        messages: message,
        invitation_code: Math.random()
          .toString(36)
          .substring(2, 35),
      });
    }

    resolve(item);
  }).then(item => {
    seeder.connect(config.db, function() {
      let data = [
        {
          model: 'Room',
          documents: item,
        },
      ];
      seeder.loadModels([__dirname + '/../../app/models/room']);
      seeder.clearModels(['Room'], function() {
        seeder.populateModels(data, function() {
          seeder.disconnect();
        });
      });
    });
  });
});

function detectRoomByUsers(type, users) {
  let results = [];
  let userCount =
    type == configCommon.ROOM_TYPE.DIRECT_CHAT
      ? 2
      : faker.random.number({ min: Math.min(minMemberCount, users.length), max: users.length });

  let shuffled = users.sort(function() {
    return 0.5 - Math.random();
  });

  shuffled.slice(0, userCount).map((user, i) => {
    results.push({
      user: user._id,
      role:
        type == configCommon.ROOM_TYPE.DIRECT_CHAT
          ? configCommon.MEMBER_ROLE.MEMBER
          : i == 0
          ? configCommon.MEMBER_ROLE.ADMIN
          : faker.random.number({ min: configCommon.MEMBER_ROLE.MEMBER, max: configCommon.MEMBER_ROLE.READ_ONLY }),
      pinned: faker.random.boolean(),
      last_message_id: null,
    });
  });

  return results;
}

function randomUserForMessage(data) {
  return data[Math.floor(Math.random() * data.length)];
}
