const path = require('path');

// Mock sqlite3 before requiring database module
jest.mock('sqlite3', () => {
  const mockDatabase = {
    close: jest.fn((callback) => callback(null)),
    run: jest.fn(),
    get: jest.fn(),
    all: jest.fn(),
    serialize: jest.fn((callback) => callback())
  };

  return {
    verbose: jest.fn(() => ({
      Database: jest.fn((dbPath, callback) => {
        setTimeout(() => callback(null), 0);
        return mockDatabase;
      })
    }))
  };
});

jest.mock('fs');
jest.mock('../../db/migrations/init', () => jest.fn().mockResolvedValue(true));

describe('Database Operations', () => {
  let db;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    
    const fs = require('fs');
    fs.existsSync = jest.fn().mockReturnValue(true);
    fs.statSync = jest.fn().mockReturnValue({ size: 1024 });
    fs.readdirSync = jest.fn().mockReturnValue(['database.sqlite', 'migrations']);
    
    db = require('../../db/database');
  });

  describe('connect', () => {
    it('should connect to database successfully', async () => {
      const result = await db.connect();
      expect(result).toBeDefined();
    });

    it('should return existing connection if already connected', async () => {
      const firstConnection = await db.connect();
      const secondConnection = await db.connect();
      expect(firstConnection).toBe(secondConnection);
    });
  });

  describe('getDb', () => {
    it('should return database instance after connection', async () => {
      await db.connect();
      const dbInstance = db.getDb();
      expect(dbInstance).toBeDefined();
    });
  });

  describe('closeConnection', () => {
    it('should close database connection', async () => {
      await db.connect();
      await expect(db.closeConnection()).resolves.toBeUndefined();
    });

    it('should resolve if no connection exists', async () => {
      await expect(db.closeConnection()).resolves.toBeUndefined();
    });
  });

  describe('database file operations', () => {
    it('should check database file existence on connect', async () => {
      const fs = require('fs');
      await db.connect();
      expect(fs.existsSync).toHaveBeenCalled();
    });
  });
});
