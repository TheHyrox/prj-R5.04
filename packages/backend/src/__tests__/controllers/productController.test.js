const productController = require('../../controllers/productController');
const db = require('../../db/database');

jest.mock('../../db/database');

describe('Product Controller', () => {
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

  describe('getAllProducts', () => {
    it('should return all products with details', async () => {
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

      await productController.getAllProducts(req, res);

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockDb.all).toHaveBeenCalledWith('SELECT * FROM products', [], expect.any(Function));
      expect(res.json).toHaveBeenCalledWith({
        message: 'success',
        data: expect.arrayContaining([
          expect.objectContaining({ id: 1, name: 'Product 1' }),
          expect.objectContaining({ id: 2, name: 'Product 2' })
        ])
      });
    });

    it('should handle error when getting products', () => {
      mockDb.all.mockImplementation((query, params, callback) => {
        callback(new Error('Database error'), null);
      });

      productController.getAllProducts(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Database error' });
    });
  });

  describe('createProduct', () => {
    it('should create a new product successfully', () => {
      req.body = {
        name: 'New Product',
        price: 150,
        stock: 20
      };

      mockDb.run.mockImplementation((query, params, callback) => {
        callback.call({ lastID: 1 }, null);
      });

      productController.createProduct(req, res);

      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO products'),
        ['New Product', 150, 20],
        expect.any(Function)
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        id: 1,
        name: 'New Product',
        price: 150,
        stock: 20
      });
    });

    it('should handle error when creating product', () => {
      req.body = {
        name: 'New Product',
        price: 150,
        stock: 20
      };

      mockDb.run.mockImplementation((query, params, callback) => {
        callback.call({ lastID: 1 }, new Error('Database error'));
      });

      productController.createProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error creating product' });
    });
  });

  describe('getProduct', () => {
    it('should return a single product', () => {
      req.params.id = '1';

      const mockProduct = { id: 1, name: 'Product 1', price: 100, stock: 10 };

      mockDb.get.mockImplementation((query, params, callback) => {
        callback(null, mockProduct);
      });

      productController.getProduct(req, res);

      expect(mockDb.get).toHaveBeenCalledWith('SELECT * FROM products WHERE id = ?', ['1'], expect.any(Function));
      expect(res.json).toHaveBeenCalledWith({
        message: 'success',
        data: mockProduct
      });
    });

    it('should handle error when getting product', () => {
      req.params.id = '1';

      mockDb.get.mockImplementation((query, params, callback) => {
        callback(new Error('Database error'), null);
      });

      productController.getProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Database error' });
    });
  });

  describe('updateStock', () => {
    it('should update product stock successfully', () => {
      req.params.id = '1';
      req.body.stock = 50;

      mockDb.run.mockImplementation((query, params, callback) => {
        callback.call({ changes: 1 }, null);
      });

      productController.updateStock(req, res);

      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE products SET stock = ? WHERE id = ?'),
        [50, '1'],
        expect.any(Function)
      );
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it('should handle product not found', () => {
      req.params.id = '999';
      req.body.stock = 50;

      mockDb.run.mockImplementation((query, params, callback) => {
        callback.call({ changes: 0 }, null);
      });

      productController.updateStock(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Product not found' });
    });

    it('should handle error when updating stock', () => {
      req.params.id = '1';
      req.body.stock = 50;

      mockDb.run.mockImplementation((query, params, callback) => {
        callback.call({ changes: 0 }, new Error('Database error'));
      });

      productController.updateStock(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to update stock' });
    });
  });
});
