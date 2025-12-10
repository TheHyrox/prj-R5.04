import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Navigation from '../../components/Navigation';
import * as api from '../../services/api';

jest.mock('../../services/api');

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('Navigation Component', () => {
  const mockOnLogout = jest.fn();

  beforeEach(() => {
    localStorage.setItem('user', JSON.stringify({ firstname: 'John', lastname: 'Doe' }));
    jest.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  const renderNavigation = () => {
    return render(
      <BrowserRouter>
        <Navigation onLogout={mockOnLogout} />
      </BrowserRouter>
    );
  };

  it('should render navigation links', () => {
    renderNavigation();
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Products')).toBeInTheDocument();
  });

  it('should display user greeting', () => {
    renderNavigation();
    expect(screen.getByText(/Good/)).toBeInTheDocument();
    expect(screen.getByText(/John/)).toBeInTheDocument();
  });

  it('should render logout button', () => {
    renderNavigation();
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
  });

  it('should call logout when logout button is clicked', () => {
    api.logout = jest.fn();
    renderNavigation();

    const logoutButton = screen.getByRole('button', { name: /logout/i });
    fireEvent.click(logoutButton);

    expect(api.logout).toHaveBeenCalled();
    expect(mockOnLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('should handle missing user data gracefully', () => {
    localStorage.removeItem('user');
    renderNavigation();
    expect(screen.getByText(/Good/)).toBeInTheDocument();
  });
});
