import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../App';

describe('App Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should render login page when not authenticated', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
  });

  it('should render navigation when authenticated', () => {
    localStorage.setItem('token', 'mockToken');
    localStorage.setItem('user', JSON.stringify({ firstname: 'John' }));
    render(<App />);
    expect(screen.getByText(/Good/)).toBeInTheDocument();
  });
});
