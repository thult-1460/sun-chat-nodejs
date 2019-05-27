const { checkInputSearchContact } = require('./actions/contact');

exports.validate = (type, app) => {
  switch (type) {
    case 'addContact': {
      return [checkInputSearchContact()];
    }
  }
};
