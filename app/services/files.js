'use strict';

const fs = require('fs');
const config = require('../../config/config.js');

exports.saveImage = async (base64Image, fileName) => {

  let base64Data = base64Image.replace(/^data:image\/png;base64,/, '');

  if (!fs.existsSync(config.DIR_UPLOAD_FILE)) {
    await fs.mkdir(config.DIR_UPLOAD_FILE, err => {
      if (err) throw err;
    });
  }

  const avatar_url = fileName + '-' + Date.now() + '.png';

  await fs.writeFile(config.DIR_UPLOAD_FILE + avatar_url, base64Data, 'base64', function(err) {
    if (err) throw err;
  });

  return avatar_url;
};
