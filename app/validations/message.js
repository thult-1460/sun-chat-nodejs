const { checkContent } = require('./actions/message');

exports.validate = (type, app) => {
  switch (type) {
    case 'create': {
      return [checkContent()];
    }
  }
};
