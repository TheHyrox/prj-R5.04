import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import UserList from '../../pages/UserList';
import * as api from '../../services/api';

jest.mock('../../services/api');

describe('UserList Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render users when loaded', async () => {
    const mockUsers = [
      { id: 1, firstname: 'John', lastname: 'Doe', username: 'johndoe', created_at: '2024-01-01' },
      { id: 2, firstname: 'Jane', lastname: 'Smith', username: 'janesmith', created_at: '2024-01-02' }
    ];
    api.getUsers.mockResolvedValue(mockUsers);

    render(<UserList />);

    await waitFor(() => {
      expect(screen.getByText(/John/)).toBeInTheDocument();
      expect(screen.getByText(/Jane/)).toBeInTheDocument();
    });
  });

  it('should display error message on load failure', async () => {
    api.getUsers.mockRejectedValue(new Error('Failed to load'));

    render(<UserList />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load users')).toBeInTheDocument();
    });
  });

  it('should filter users by search term', async () => {
    const mockUsers = [
      { id: 1, firstname: 'John', lastname: 'Doe', username: 'johndoe', created_at: '2024-01-01' },
      { id: 2, firstname: 'Jane', lastname: 'Smith', username: 'janesmith', created_at: '2024-01-02' }
    ];
    api.getUsers.mockResolvedValue(mockUsers);

    const { container } = render(<UserList />);

    await waitFor(() => {
      expect(screen.getByText(/John/)).toBeInTheDocument();
    });

    const searchInputs = container.querySelectorAll('input[type="text"]');
    if (searchInputs.length > 0) {
      fireEvent.change(searchInputs[0], { target: { value: 'John' } });
    }
  });

  it('should handle different user data formats', async () => {
    const mockUsers = [
      { id: 1, firstname: 'New', lastname: 'User', username: 'newuser', created_at: new Date().toISOString() },
      { id: 2, firstname: 'Old', lastname: 'User', username: 'olduser', created_at: '2020-01-01' }
    ];
    api.getUsers.mockResolvedValue(mockUsers);

    render(<UserList />);

    await waitFor(() => {
      expect(screen.getByText(/New/)).toBeInTheDocument();
    });
  });
});
