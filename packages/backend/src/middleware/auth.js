const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(
        token.split(' ')[1],
        'your-super-secret-key-that-should-not-be-hardcoded'
    );

    req.user = decoded;
    next();
  } catch(e) {
    console.error('Auth error:', e);
    res.status(401).json({ error: 'Failed to authenticate token' });
  }
};

module.exports = auth;
