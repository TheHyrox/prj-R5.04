import { formatDate, formatPrice, formatStock, formatUserName } from '../../utils/formatting';

describe('Formatting Utils', () => {
  describe('formatDate', () => {
    it('should format valid date correctly', () => {
      const result = formatDate('2024-12-08');
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/2024/);
    });

    it('should return "Invalid Date" for null input', () => {
      expect(formatDate(null)).toBe('Invalid Date');
    });

    it('should return "Invalid Date" for undefined input', () => {
      expect(formatDate(undefined)).toBe('Invalid Date');
    });

    it('should handle Date object', () => {
      const date = new Date(2024, 0, 1);
      const result = formatDate(date);
      expect(result).toBe('1/1/2024');
    });
  });

  describe('formatPrice', () => {
    it('should format price with dollar sign and decimals', () => {
      expect(formatPrice(99.99)).toBe('$99.99');
    });

    it('should format price with commas for thousands', () => {
      expect(formatPrice(1000)).toBe('$1,000.00');
      expect(formatPrice(1000000)).toBe('$1,000,000.00');
    });

    it('should return $0.00 for null', () => {
      expect(formatPrice(null)).toBe('$0.00');
    });

    it('should return $0.00 for undefined', () => {
      expect(formatPrice(undefined)).toBe('$0.00');
    });

    it('should return $0.00 for invalid number', () => {
      expect(formatPrice('invalid')).toBe('$0.00');
    });

    it('should handle zero price', () => {
      expect(formatPrice(0)).toBe('$0.00');
    });

    it('should handle string number', () => {
      expect(formatPrice('99.99')).toBe('$99.99');
    });
  });

  describe('formatStock', () => {
    it('should show "Out of Stock" for zero', () => {
      expect(formatStock(0)).toBe('Out of Stock');
    });

    it('should show "Out of Stock" for invalid number', () => {
      expect(formatStock('invalid')).toBe('Out of Stock');
    });

    it('should show "Low Stock" for less than 5', () => {
      expect(formatStock(4)).toBe('Low Stock (4 left)');
      expect(formatStock(1)).toBe('Low Stock (1 left)');
    });

    it('should show "Limited Stock" for 5-9', () => {
      expect(formatStock(5)).toBe('Limited Stock (5 available)');
      expect(formatStock(9)).toBe('Limited Stock (9 available)');
    });

    it('should show "In Stock" for 10 or more', () => {
      expect(formatStock(10)).toBe('In Stock (10)');
      expect(formatStock(100)).toBe('In Stock (100)');
    });
  });

  describe('formatUserName', () => {
    it('should format full name correctly', () => {
      expect(formatUserName('John', 'Doe')).toBe('John Doe');
    });

    it('should handle only firstname', () => {
      expect(formatUserName('John', '')).toBe('John');
    });

    it('should handle only lastname', () => {
      expect(formatUserName('', 'Doe')).toBe('Doe');
    });

    it('should return "Unknown User" for empty inputs', () => {
      expect(formatUserName('', '')).toBe('Unknown User');
      expect(formatUserName(null, null)).toBe('Unknown User');
    });

    it('should trim whitespace', () => {
      expect(formatUserName('  John  ', '  Doe  ')).toBe('John Doe');
    });
  });
});
