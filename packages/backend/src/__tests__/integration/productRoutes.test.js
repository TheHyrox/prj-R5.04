const request = require('supertest');
const express = require('express');
const productRoutes = require('../../routes/productRoutes');
const db = require('../../db/database');
const jwt = require('jsonwebtoken');

jest.mock('../../db/database');
jest.mock('jsonwebtoken');

describe('Product Routes Integration Tests', () => {
  let app;
  let mockDb;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api', productRoutes);
  });

  beforeEach(() => {
    mockDb = {
      run: jest.fn(),
      get: jest.fn(),
      all: jest.fn()
    };
    db.getDb.mockReturnValue(mockDb);
    jwt.verify.mockReturnValue({ id: 1 });
    jest.clearAllMocks();
  });

  describe('GET /api/products', () => {
    it('should return all products with valid token', async () => {
      const mockProducts = [
        { id: 1, name: 'Product 1', price: 100, stock: 10 },
        { id: 2, name: 'Product 2', price: 200, stock: 5 }
      ];

      mockDb.all.mockImplementation((query, params, callback) => {
        callback(null, mockProducts);
      });

      mockDb.get.mockImplementation((query, params, callback) => {
        if (query.includes('COUNT')) {
          callback(null, { total: 1 });
        } else if (query.includes('AVG')) {
          callback(null, { avg: 150 });
        }
      });

      const response = await request(app).get('/api/products').set('Authorization', 'Bearer validtoken');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('success');
      expect(response.body.data).toHaveLength(2);
    });

    it('should return 401 without token', async () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const response = await request(app).get('/api/products');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/products', () => {
    it('should create a new product with valid token', async () => {
      mockDb.run.mockImplementation((query, params, callback) => {
        callback.call({ lastID: 1 }, null);
      });

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', 'Bearer validtoken')
        .send({
          name: 'New Product',
          price: 150,
          stock: 20
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        id: 1,
        name: 'New Product',
        price: 150,
        stock: 20
      });
    });

    it('should return 500 on database error', async () => {
      mockDb.run.mockImplementation((query, params, callback) => {
        callback.call({ lastID: 1 }, new Error('Database error'));
      });

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', 'Bearer validtoken')
        .send({
          name: 'New Product',
          price: 150,
          stock: 20
        });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Error creating product' });
    });
  });

  describe('GET /api/products/:id', () => {
    it('should return a single product', async () => {
      const mockProduct = { id: 1, name: 'Product 1', price: 100, stock: 10 };

      mockDb.get.mockImplementation((query, params, callback) => {
        callback(null, mockProduct);
      });

      const response = await request(app).get('/api/products/1').set('Authorization', 'Bearer validtoken');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('success');
      expect(response.body.data).toEqual(mockProduct);
    });

    it('should handle database error', async () => {
      mockDb.get.mockImplementation((query, params, callback) => {
        callback(new Error('Database error'), null);
      });

      const response = await request(app).get('/api/products/1').set('Authorization', 'Bearer validtoken');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Database error' });
    });
  });

  describe('PATCH /api/products/:id/stock', () => {
    it('should update product stock', async () => {
      mockDb.run.mockImplementation((query, params, callback) => {
        callback.call({ changes: 1 }, null);
      });

      const response = await request(app)
        .patch('/api/products/1/stock')
        .set('Authorization', 'Bearer validtoken')
        .send({ stock: 50 });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });
    });

    it('should return 404 for non-existent product', async () => {
      mockDb.run.mockImplementation((query, params, callback) => {
        callback.call({ changes: 0 }, null);
      });

      const response = await request(app)
        .patch('/api/products/999/stock')
        .set('Authorization', 'Bearer validtoken')
        .send({ stock: 50 });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Product not found' });
    });

    it('should handle database error', async () => {
      mockDb.run.mockImplementation((query, params, callback) => {
        callback.call({ changes: 0 }, new Error('Database error'));
      });

      const response = await request(app)
        .patch('/api/products/1/stock')
        .set('Authorization', 'Bearer validtoken')
        .send({ stock: 50 });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to update stock' });
    });
  });
});
