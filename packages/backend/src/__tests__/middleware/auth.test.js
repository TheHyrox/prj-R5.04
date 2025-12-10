const jwt = require('jsonwebtoken');
const auth = require('../../middleware/auth');

jest.mock('jsonwebtoken');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should authenticate valid token', () => {
    req.headers.authorization = 'Bearer validtoken123';
    const mockDecoded = { id: 1, username: 'testuser' };

    jwt.verify.mockReturnValue(mockDecoded);

    auth(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith('validtoken123', 'your-super-secret-key-that-should-not-be-hardcoded');
    expect(req.user).toEqual(mockDecoded);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should reject request without token', () => {
    auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should reject invalid token', () => {
    req.headers.authorization = 'Bearer invalidtoken';

    jwt.verify.mockImplementation(() => {
      throw new Error('Invalid token');
    });

    auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to authenticate token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should reject malformed authorization header', () => {
    req.headers.authorization = 'InvalidFormat';

    jwt.verify.mockImplementation(() => {
      throw new Error('jwt malformed');
    });

    auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to authenticate token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should reject expired token', () => {
    req.headers.authorization = 'Bearer expiredtoken';

    jwt.verify.mockImplementation(() => {
      throw new Error('jwt expired');
    });

    auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to authenticate token' });
    expect(next).not.toHaveBeenCalled();
  });
});
