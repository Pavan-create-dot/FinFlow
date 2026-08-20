const jwt = require('jsonwebtoken');

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required' });
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_ACCESS_SECRET || 'super_secret_access_123';

  jwt.verify(token, secret, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

const generateTokens = (user) => {
  const accessSecret = process.env.JWT_ACCESS_SECRET || 'super_secret_access_123';
  const refreshSecret = process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_456';

  const accessToken = jwt.sign(
    { id: user.id || user._id, email: user.email },
    accessSecret,
    { expiresIn: '1h' }
  );

  const refreshToken = jwt.sign(
    { id: user.id || user._id, email: user.email },
    refreshSecret,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

const errorHandler = (err, req, res, next) => {
  console.error('Server Error:', err.message || err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: err.message || 'Internal Server Error'
  });
};

module.exports = { authenticateJWT, generateTokens, errorHandler };
