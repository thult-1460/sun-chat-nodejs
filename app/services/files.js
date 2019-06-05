'use strict';

const fs = require('fs');
const config = require('../../config/config.js');

const path = config.DIR_UPLOAD_FILE;

exports.saveImage = async (base64Image, fileName, oldUrl = '') => {
  if (oldUrl !== '' && fs.existsSync(path + oldUrl)) {
    await fs.unlink(path + oldUrl, (err) => {
      if (err) throw err;
    });
  }

  let base64Data = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');

  if (!fs.existsSync(path)) {
    await fs.mkdir(path, err => {
      if (err) throw err;
    });
  }

  const avatar = fileName + '-' + Date.now() + '.png';

  await fs.writeFile(path + avatar, base64Data, 'base64', function(err) {
    if (err) throw err;
  });

  return avatar;
};
