import { validateEmail, validatePassword, validateUser, validateProduct } from '../../utils/validation';

describe('Validation Utils', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(validateEmail('name+tag@example.com')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('invalid@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should validate strong password', () => {
      const result = validatePassword('StrongPass123');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject password without uppercase', () => {
      const result = validatePassword('weakpass123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain uppercase');
    });

    it('should reject password without lowercase', () => {
      const result = validatePassword('WEAKPASS123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain lowercase');
    });

    it('should reject password without number', () => {
      const result = validatePassword('WeakPassword');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain number');
    });

    it('should reject short password', () => {
      const result = validatePassword('Pass1');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters');
    });

    it('should return multiple errors', () => {
      const result = validatePassword('weak');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('validateUser', () => {
    it('should validate complete user data', () => {
      const user = {
        firstname: 'John',
        lastname: 'Doe',
        username: 'johndoe',
        password: 'StrongPass123'
      };
      const result = validateUser(user);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('should reject missing firstname', () => {
      const user = {
        lastname: 'Doe',
        username: 'johndoe',
        password: 'StrongPass123'
      };
      const result = validateUser(user);
      expect(result.isValid).toBe(false);
      expect(result.errors.firstname).toBe('First name is required');
    });

    it('should reject missing lastname', () => {
      const user = {
        firstname: 'John',
        username: 'johndoe',
        password: 'StrongPass123'
      };
      const result = validateUser(user);
      expect(result.isValid).toBe(false);
      expect(result.errors.lastname).toBe('Last name is required');
    });

    it('should reject short username', () => {
      const user = {
        firstname: 'John',
        lastname: 'Doe',
        username: 'jo',
        password: 'StrongPass123'
      };
      const result = validateUser(user);
      expect(result.isValid).toBe(false);
      expect(result.errors.username).toBe('Username too short');
    });

    it('should reject weak password', () => {
      const user = {
        firstname: 'John',
        lastname: 'Doe',
        username: 'johndoe',
        password: 'weak'
      };
      const result = validateUser(user);
      expect(result.isValid).toBe(false);
      expect(result.errors.password).toBeDefined();
    });

    it('should reject missing password', () => {
      const user = {
        firstname: 'John',
        lastname: 'Doe',
        username: 'johndoe'
      };
      const result = validateUser(user);
      expect(result.isValid).toBe(false);
      expect(result.errors.password).toBe('Password is required');
    });
  });

  describe('validateProduct', () => {
    it('should validate complete product data', () => {
      const product = {
        name: 'Test Product',
        price: 99.99,
        stock: 10
      };
      const result = validateProduct(product);
      expect(result.valid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('should reject missing product name', () => {
      const product = {
        name: '',
        price: 99.99,
        stock: 10
      };
      const result = validateProduct(product);
      expect(result.valid).toBe(false);
      expect(result.errors.name).toBe('Name is required');
    });

    it('should reject product with only whitespace name', () => {
      const product = {
        name: '   ',
        price: 99.99,
        stock: 10
      };
      const result = validateProduct(product);
      expect(result.valid).toBe(false);
      expect(result.errors.name).toBe('Name is required');
    });
  });
});
