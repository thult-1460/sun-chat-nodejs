const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET;

// middleware check token is invalid when requested
exports.jwtMiddleware = (req, res, next) => {
  const token = req.headers.authorization;

  if (token) {
    jwt.verify(token, jwtSecret, function(err, decoded) {
      if (err) {
        return res.status(401).json({ errorMsg: __('token_invalid') });
      }
      req.decoded = decoded;

      next();
    });
  } else {
    return res.status(401).json({ errorMsg: __('token_invalid') });
  }
};
