import { renderHook, act } from '@testing-library/react';
import axios from 'axios';
import { useApi } from '../../hooks/useApi';

jest.mock('axios');

describe('useApi Hook', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('should initialize with loading false and no error', () => {
    const { result } = renderHook(() => useApi());
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should make successful GET request', async () => {
    const mockData = { data: 'test' };
    axios.mockResolvedValue({ data: mockData });

    const { result } = renderHook(() => useApi());

    let response;
    await act(async () => {
      response = await result.current.get('http://api.test/data');
    });

    expect(axios).toHaveBeenCalledWith({
      method: 'GET',
      url: 'http://api.test/data',
      headers: { Authorization: undefined }
    });
    expect(response).toEqual(mockData);
    expect(result.current.loading).toBe(false);
  });

  it('should make successful POST request with auth', async () => {
    localStorage.setItem('token', 'mockToken');
    const mockData = { success: true };
    axios.mockResolvedValue({ data: mockData });

    const { result } = renderHook(() => useApi());
    const postData = { name: 'test' };

    await act(async () => {
      await result.current.post('http://api.test/data', postData);
    });

    expect(axios).toHaveBeenCalledWith({
      method: 'POST',
      url: 'http://api.test/data',
      data: postData,
      headers: { Authorization: 'Bearer mockToken' }
    });
  });

  it('should handle request error', async () => {
    const mockError = {
      response: {
        data: { error: 'Request failed' }
      }
    };
    axios.mockRejectedValue(mockError);

    const { result } = renderHook(() => useApi());

    await act(async () => {
      try {
        await result.current.get('http://api.test/error');
      } catch (err) {
        // Expected
      }
    });

    expect(result.current.error).toBe('Request failed');
    expect(result.current.loading).toBe(false);
  });

  it('should handle generic error', async () => {
    axios.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useApi());

    await act(async () => {
      try {
        await result.current.get('http://api.test/error');
      } catch (err) {
        // Expected
      }
    });

    expect(result.current.error).toBe('An error occurred');
  });

  it('should make PUT request', async () => {
    axios.mockResolvedValue({ data: { updated: true } });

    const { result } = renderHook(() => useApi());

    await act(async () => {
      await result.current.put('http://api.test/update', { id: 1 });
    });

    expect(axios).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'PUT',
        url: 'http://api.test/update'
      })
    );
  });

  it('should make DELETE request', async () => {
    axios.mockResolvedValue({ data: { deleted: true } });

    const { result } = renderHook(() => useApi());

    await act(async () => {
      await result.current.delete('http://api.test/delete');
    });

    expect(axios).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'DELETE',
        url: 'http://api.test/delete'
      })
    );
  });
});
