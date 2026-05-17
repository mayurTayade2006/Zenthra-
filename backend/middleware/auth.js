const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'zenthra_super_secret_key_2026';

module.exports = function(req, res, next) {
  // Get token from header
  const token = req.header('Authorization');

  // Check if no token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const bearer = token.split(' ')[1] || token;
    const decoded = jwt.verify(bearer, JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};
