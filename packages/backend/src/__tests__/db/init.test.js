const bcrypt = require('bcryptjs');

jest.mock('bcryptjs');

describe('Database Initialization', () => {
  let initDatabase;
  let mockDb;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    bcrypt.hashSync = jest.fn().mockReturnValue('hashedPassword');

    mockDb = {
      serialize: jest.fn((callback) => callback()),
      run: jest.fn(),
      get: jest.fn()
    };

    initDatabase = require('../../db/migrations/init');
  });

  it('should create users table successfully', async () => {
    mockDb.run.mockImplementation((query, paramsOrCallback, callback) => {
      const cb = typeof paramsOrCallback === 'function' ? paramsOrCallback : callback;
      if (query.includes('CREATE TABLE IF NOT EXISTS users')) {
        cb(null);
      }
    });

    mockDb.get.mockImplementation((query, params, callback) => {
      callback(null, { count: 1 });
    });

    await initDatabase(mockDb);

    expect(mockDb.run).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS users'), expect.any(Function));
  });

  it('should create products table successfully', async () => {
    mockDb.run.mockImplementation((query, paramsOrCallback, callback) => {
      const cb = typeof paramsOrCallback === 'function' ? paramsOrCallback : callback;
      if (query.includes('CREATE TABLE IF NOT EXISTS products')) {
        cb(null);
      }
    });

    mockDb.get.mockImplementation((query, params, callback) => {
      callback(null, { count: 1 });
    });

    await initDatabase(mockDb);

    expect(mockDb.run).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS products'), expect.any(Function));
  });

  it('should insert admin user when users table is empty', async () => {
    mockDb.run.mockImplementation((query, paramsOrCallback, callback) => {
      const cb = typeof paramsOrCallback === 'function' ? paramsOrCallback : callback;
      if (cb) cb(null);
    });

    mockDb.get.mockImplementation((query, params, callback) => {
      if (query.includes('users')) {
        callback(null, { count: 0 });
      } else {
        callback(null, { count: 1 });
      }
    });

    await initDatabase(mockDb);

    const insertUserCall = mockDb.run.mock.calls.find((call) => call[0].includes('INSERT INTO users'));
    expect(insertUserCall).toBeDefined();
    expect(insertUserCall[1][0]).toBe('Admin');
    expect(insertUserCall[1][1]).toBe('User');
    expect(insertUserCall[1][2]).toBe('admin');
  });

  it('should insert sample products when products table is empty', async () => {
    mockDb.run.mockImplementation((query, paramsOrCallback, callback) => {
      const cb = typeof paramsOrCallback === 'function' ? paramsOrCallback : callback;
      if (cb) cb(null);
    });

    mockDb.get.mockImplementation((query, params, callback) => {
      if (query.includes('products')) {
        callback(null, { count: 0 });
      } else {
        callback(null, { count: 1 });
      }
    });

    await initDatabase(mockDb);

    expect(mockDb.run).toHaveBeenCalledWith('INSERT INTO products (name, price, stock) VALUES (?, ?, ?)', ['Laptop', 999.99, 10], expect.any(Function));
    expect(mockDb.run).toHaveBeenCalledWith('INSERT INTO products (name, price, stock) VALUES (?, ?, ?)', ['Smartphone', 499.99, 15], expect.any(Function));
    expect(mockDb.run).toHaveBeenCalledWith('INSERT INTO products (name, price, stock) VALUES (?, ?, ?)', ['Headphones', 79.99, 20], expect.any(Function));
  });

  it('should not insert data when tables are not empty', async () => {
    mockDb.run.mockImplementation((query, paramsOrCallback, callback) => {
      const cb = typeof paramsOrCallback === 'function' ? paramsOrCallback : callback;
      if (cb) cb(null);
    });

    mockDb.get.mockImplementation((query, params, callback) => {
      callback(null, { count: 5 });
    });

    await initDatabase(mockDb);

    const insertCalls = mockDb.run.mock.calls.filter((call) => call[0].includes('INSERT'));
    expect(insertCalls.length).toBe(0);
  });

  it('should reject on users table creation error', async () => {
    mockDb.run.mockImplementation((query, paramsOrCallback, callback) => {
      const cb = typeof paramsOrCallback === 'function' ? paramsOrCallback : callback;
      if (query.includes('CREATE TABLE IF NOT EXISTS users')) {
        cb(new Error('Table creation error'));
      }
    });

    mockDb.get.mockImplementation((query, params, callback) => {
      callback(null, { count: 1 });
    });

    await expect(initDatabase(mockDb)).rejects.toThrow('Table creation error');
  });

  it('should reject on products table creation error', async () => {
    mockDb.run.mockImplementation((query, paramsOrCallback, callback) => {
      const cb = typeof paramsOrCallback === 'function' ? paramsOrCallback : callback;
      if (query.includes('CREATE TABLE IF NOT EXISTS products')) {
        cb(new Error('Table creation error'));
      } else {
        cb(null);
      }
    });

    mockDb.get.mockImplementation((query, params, callback) => {
      callback(null, { count: 1 });
    });

    await expect(initDatabase(mockDb)).rejects.toThrow('Table creation error');
  });

  it('should reject on error checking users count', async () => {
    mockDb.run.mockImplementation((query, paramsOrCallback, callback) => {
      const cb = typeof paramsOrCallback === 'function' ? paramsOrCallback : callback;
      if (cb) cb(null);
    });

    mockDb.get.mockImplementation((query, params, callback) => {
      if (query.includes('users')) {
        callback(new Error('Database error'));
      } else {
        callback(null, { count: 1 });
      }
    });

    await expect(initDatabase(mockDb)).rejects.toThrow('Database error');
  });

  it('should reject on error checking products count', async () => {
    mockDb.run.mockImplementation((query, paramsOrCallback, callback) => {
      const cb = typeof paramsOrCallback === 'function' ? paramsOrCallback : callback;
      if (cb) cb(null);
    });

    mockDb.get.mockImplementation((query, params, callback) => {
      if (query.includes('products')) {
        callback(new Error('Database error'));
      } else {
        callback(null, { count: 1 });
      }
    });

    await expect(initDatabase(mockDb)).rejects.toThrow('Database error');
  });
});
