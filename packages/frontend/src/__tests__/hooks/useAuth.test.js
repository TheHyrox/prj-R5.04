import { renderHook, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('useAuth Hook', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  const wrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>;

  it('should initialize with null user', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.user).toBeNull();
  });

  it('should load user from localStorage', async () => {
    const mockUser = { id: 1, username: 'testuser' };
    localStorage.setItem('token', 'mockToken');
    localStorage.setItem('user', JSON.stringify(mockUser));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.loading).toBe(false);
  });

  it('should login user', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    const mockUser = { id: 1, username: 'newuser' };

    act(() => {
      result.current.login('newToken', mockUser);
    });

    expect(localStorage.getItem('token')).toBe('newToken');
    expect(localStorage.getItem('user')).toBe(JSON.stringify(mockUser));
    expect(result.current.user).toEqual(mockUser);
  });

  it('should logout user', () => {
    localStorage.setItem('token', 'mockToken');
    localStorage.setItem('user', JSON.stringify({ id: 1 }));

    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.logout();
    });

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(result.current.user).toBeNull();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('should handle login error', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock localStorage to throw error
    Storage.prototype.setItem = jest.fn(() => {
      throw new Error('Storage error');
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.login('token', { id: 1 });
    });

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
    Storage.prototype.setItem.mockRestore();
  });
});
