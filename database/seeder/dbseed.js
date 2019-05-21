const user = require('./users_seeder');
const room = require('./rooms_seeder');

async function dbseed() {
  await user();
  await room();

  console.log('data generate successfull');
}
