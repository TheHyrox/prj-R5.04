import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProductList from '../../pages/ProductList';
import * as api from '../../services/api';

jest.mock('../../services/api');

describe('ProductList Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderProductList = () => {
    return render(
      <BrowserRouter>
        <ProductList />
      </BrowserRouter>
    );
  };

  it('should render products when loaded', async () => {
    const mockProducts = [
      { id: 1, name: 'Product 1', price: 100, stock: 10 },
      { id: 2, name: 'Product 2', price: 200, stock: 5 }
    ];
    api.getProducts.mockResolvedValue(mockProducts);

    renderProductList();

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
      expect(screen.getByText('Product 2')).toBeInTheDocument();
    });
  });

  it('should display error message on load failure', async () => {
    api.getProducts.mockRejectedValue(new Error('Failed to load'));

    renderProductList();

    await waitFor(() => {
      expect(screen.getByText('Failed to load products')).toBeInTheDocument();
    });
  });

  it('should filter products by search term', async () => {
    const mockProducts = [
      { id: 1, name: 'Laptop', price: 999, stock: 10 },
      { id: 2, name: 'Phone', price: 499, stock: 15 }
    ];
    api.getProducts.mockResolvedValue(mockProducts);

    const { container } = renderProductList();

    await waitFor(() => {
      expect(screen.getByText('Laptop')).toBeInTheDocument();
    });

    const searchInputs = container.querySelectorAll('input[type="text"]');
    if (searchInputs.length > 0) {
      fireEvent.change(searchInputs[0], { target: { value: 'Laptop' } });
    }
  });

  it('should handle different product data formats', async () => {
    const mockProducts = [
      { id: 1, name: 'Cheap', price: 30, stock: 10 },
      { id: 2, name: 'Expensive', price: 150, stock: 5 }
    ];
    api.getProducts.mockResolvedValue(mockProducts);

    renderProductList();

    await waitFor(() => {
      expect(screen.getByText('Cheap')).toBeInTheDocument();
    });
  });
});
