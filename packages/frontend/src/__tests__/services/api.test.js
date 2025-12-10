import axios from 'axios';
import { loginUser, registerUser, getUsers, getProducts, createProduct, logout } from '../../services/api';

jest.mock('axios');

describe('API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('loginUser', () => {
    it('should login successfully and store token', async () => {
      const mockResponse = {
        data: {
          token: 'mockToken123',
          user: { id: 1, username: 'testuser' }
        }
      };
      axios.post.mockResolvedValue(mockResponse);

      const result = await loginUser('testuser', 'password123');

      expect(axios.post).toHaveBeenCalledWith('http://localhost:3001/api/auth/login', {
        username: 'testuser',
        password: 'password123'
      });
      expect(localStorage.getItem('token')).toBe('mockToken123');
      expect(localStorage.getItem('user')).toBe(JSON.stringify({ id: 1, username: 'testuser' }));
      expect(result).toEqual(mockResponse.data);
    });

    it('should throw error on login failure', async () => {
      const mockError = {
        response: {
          data: { error: 'Invalid credentials' }
        }
      };
      axios.post.mockRejectedValue(mockError);

      await expect(loginUser('wronguser', 'wrongpass')).rejects.toEqual({ error: 'Invalid credentials' });
    });
  });

  describe('registerUser', () => {
    it('should register successfully and store token', async () => {
      const mockResponse = {
        data: {
          token: 'newToken123'
        }
      };
      axios.post.mockResolvedValue(mockResponse);

      const userData = {
        username: 'newuser',
        password: 'password123',
        firstname: 'New',
        lastname: 'User'
      };

      const result = await registerUser(userData);

      expect(axios.post).toHaveBeenCalledWith('http://localhost:3001/api/auth/register', userData);
      expect(localStorage.getItem('token')).toBe('newToken123');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getUsers', () => {
    it('should fetch users with auth token', async () => {
      localStorage.setItem('token', 'mockToken');
      const mockUsers = [
        { id: 1, username: 'user1' },
        { id: 2, username: 'user2' }
      ];
      axios.get.mockResolvedValue({ data: mockUsers });

      const result = await getUsers();

      expect(axios.get).toHaveBeenCalledWith('http://localhost:3001/api/auth/users', {
        headers: { Authorization: 'Bearer mockToken' }
      });
      expect(result).toEqual(mockUsers);
    });
  });

  describe('getProducts', () => {
    it('should fetch products with auth token', async () => {
      localStorage.setItem('token', 'mockToken');
      const mockProducts = [
        { id: 1, name: 'Product 1', price: 100 },
        { id: 2, name: 'Product 2', price: 200 }
      ];
      axios.get.mockResolvedValue({ data: { data: mockProducts } });

      const result = await getProducts();

      expect(axios.get).toHaveBeenCalledWith('http://localhost:3001/api/products', {
        headers: { Authorization: 'Bearer mockToken' }
      });
      expect(result).toBeDefined();
    });
  });

  describe('createProduct', () => {
    it('should create product with auth token', async () => {
      localStorage.setItem('token', 'mockToken');
      const productData = {
        name: 'New Product',
        price: 99.99,
        stock: 10
      };
      const mockResponse = {
        data: { id: 1, ...productData }
      };
      axios.post.mockResolvedValue(mockResponse);

      const result = await createProduct(productData);

      expect(axios.post).toHaveBeenCalledWith('http://localhost:3001/api/products', productData, {
        headers: { Authorization: 'Bearer mockToken' }
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('logout', () => {
    it('should clear token and user from localStorage', () => {
      localStorage.setItem('token', 'mockToken');
      localStorage.setItem('user', JSON.stringify({ id: 1 }));

      logout();

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });
  });
});
