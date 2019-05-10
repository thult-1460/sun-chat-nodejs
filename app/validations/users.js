const { check } = require('express-validator/check');

exports.validate = (method) => {
  switch (method) {
    case 'login': {
      return [
        // ...some other validations...
        check('email')
          .not().isEmpty().withMessage('Email field is not empty'),
        check('password')
          .not().isEmpty().withMessage('Password is not empty')
          .isLength({ min: 5 }).withMessage('Password must be at least 5 chars long')
      ]
    }
  }
}
