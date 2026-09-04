const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  const token = req.header('Authorization');

  if (!token) {
    const error = new Error('No token, authorization denied');
    error.statusCode = 401;
    error.code = 'NO_TOKEN';
    return next(error);
  }

  try {
    const splitToken = token.startsWith('Bearer ') ? token.slice(7, token.length) : token;
    const decoded = jwt.verify(splitToken, process.env.JWT_SECRET || 'secretkey');
    req.user = decoded.userId;
    next();
  } catch (err) {
    const error = new Error('Token is not valid or has expired');
    error.statusCode = 401;
    error.code = 'INVALID_TOKEN';
    return next(error);
  }
};