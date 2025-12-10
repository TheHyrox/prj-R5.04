const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userController = require('../../controllers/userController');
const db = require('../../db/database');

jest.mock('../../db/database');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('User Controller', () => {
  let req, res, mockDb;

  beforeEach(() => {
    req = {
      body: {},
      params: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockDb = {
      run: jest.fn(),
      get: jest.fn(),
      all: jest.fn()
    };
    db.getDb.mockReturnValue(mockDb);
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should register a new user successfully', () => {
      req.body = {
        username: 'testuser',
        password: 'password123',
        firstname: 'Test',
        lastname: 'User'
      };

      bcrypt.hashSync.mockReturnValue('hashedPassword');
      jwt.sign.mockReturnValue('mockToken');

      mockDb.run.mockImplementation((query, params, callback) => {
        callback.call({ lastID: 1 }, null);
      });

      userController.registerUser(req, res);

      expect(bcrypt.hashSync).toHaveBeenCalledWith('password123', 8);
      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        ['testuser', 'hashedPassword', 'Test', 'User'],
        expect.any(Function)
      );
      expect(jwt.sign).toHaveBeenCalledWith({ id: 1 }, expect.any(String), { expiresIn: 86400 });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ auth: true, token: 'mockToken' });
    });

    it('should handle registration error', () => {
      req.body = {
        username: 'testuser',
        password: 'password123',
        firstname: 'Test',
        lastname: 'User'
      };

      bcrypt.hashSync.mockReturnValue('hashedPassword');

      mockDb.run.mockImplementation((query, params, callback) => {
        callback.call({ lastID: 1 }, new Error('Database error'));
      });

      userController.registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error creating user' });
    });
  });

  describe('loginUser', () => {
    it('should login user with valid credentials', () => {
      req.body = {
        username: 'testuser',
        password: 'password123'
      };

      const mockUser = {
        id: 1,
        username: 'testuser',
        password: 'hashedPassword',
        firstname: 'Test',
        lastname: 'User'
      };

      bcrypt.compareSync.mockReturnValue(true);
      jwt.sign.mockReturnValue('mockToken');

      mockDb.get.mockImplementation((query, params, callback) => {
        callback(null, mockUser);
      });

      userController.loginUser(req, res);

      expect(bcrypt.compareSync).toHaveBeenCalledWith('password123', 'hashedPassword');
      expect(jwt.sign).toHaveBeenCalledWith({ id: 1 }, expect.any(String), { expiresIn: 86400 });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        auth: true,
        token: 'mockToken',
        user: {
          id: 1,
          username: 'testuser',
          firstname: 'Test',
          lastname: 'User'
        }
      });
    });

    it('should handle user not found', () => {
      req.body = {
        username: 'nonexistent',
        password: 'password123'
      };

      mockDb.get.mockImplementation((query, params, callback) => {
        callback(null, null);
      });

      userController.loginUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'No user found.' });
    });

    it('should handle invalid password', () => {
      req.body = {
        username: 'testuser',
        password: 'wrongpassword'
      };

      const mockUser = {
        id: 1,
        username: 'testuser',
        password: 'hashedPassword',
        firstname: 'Test',
        lastname: 'User'
      };

      bcrypt.compareSync.mockReturnValue(false);

      mockDb.get.mockImplementation((query, params, callback) => {
        callback(null, mockUser);
      });

      userController.loginUser(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ auth: false, token: null });
    });

    it('should handle database error', () => {
      req.body = {
        username: 'testuser',
        password: 'password123'
      };

      mockDb.get.mockImplementation((query, params, callback) => {
        callback(new Error('Database error'), null);
      });

      userController.loginUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error on the server.' });
    });
  });

  describe('getAllUsers', () => {
    it('should return all users successfully', () => {
      const mockUsers = [
        { id: 1, username: 'user1', firstname: 'First1', lastname: 'Last1', created_at: '2024-01-01' },
        { id: 2, username: 'user2', firstname: 'First2', lastname: 'Last2', created_at: '2024-01-02' }
      ];

      mockDb.all.mockImplementation((query, params, callback) => {
        callback(null, mockUsers);
      });

      userController.getAllUsers(req, res);

      expect(mockDb.all).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, username, firstname, lastname, created_at FROM users'),
        [],
        expect.any(Function)
      );
      expect(res.json).toHaveBeenCalledWith(mockUsers);
    });

    it('should handle error when getting users', () => {
      mockDb.all.mockImplementation((query, params, callback) => {
        callback(new Error('Database error'), null);
      });

      userController.getAllUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error getting users' });
    });
  });

  describe('findSimilarUsernames', () => {
    it('should find similar usernames', () => {
      const mockUsers = [{ username: 'john' }, { username: 'johnn' }, { username: 'alice' }];

      mockDb.all.mockImplementation((query, params, callback) => {
        callback(null, mockUsers);
      });

      userController.findSimilarUsernames(req, res);

      expect(mockDb.all).toHaveBeenCalledWith('SELECT username FROM users', [], expect.any(Function));
      expect(res.json).toHaveBeenCalled();
    });

    it('should handle database error', () => {
      mockDb.all.mockImplementation((query, params, callback) => {
        callback(new Error('Database error'), null);
      });

      userController.findSimilarUsernames(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Database error' });
    });
  });
});
