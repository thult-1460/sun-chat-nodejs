const config = require(__dirname + '/../../config');
const seeder = require('mongoose-seed');
const faker = require('faker');

const userCount = 10;

seeder.connect(config.db, function() {
  seeder.loadModels([__dirname + '/../../app/models/user']);
  seeder.clearModels(['User'], function() {
    seeder.populateModels(renderFakerData(), function() {
      seeder.disconnect();
    });
  });
});

function renderFakerData() {
  let documents = [];

  for (let i = 0; i < userCount; i++) {
    documents.push({
      name: faker.name.lastName(),
      username: faker.internet.userName(),
      email: faker.internet.email(),
      password: '123456',
      avatar: faker.image.avatar(),
      active: true,
    });
  }

  return (data = [
    {
      model: 'User',
      documents: documents,
    },
  ]);
}
