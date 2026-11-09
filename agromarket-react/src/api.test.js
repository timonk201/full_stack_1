import { apiFetch } from './api.js';

describe('apiFetch', () => {
  test('добавляет JWT в заголовок запроса', async () => {
    localStorage.setItem('token', 'test-token');
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue([]),
    });

    await apiFetch('/orders');

    expect(fetchSpy.mock.calls[0][1].headers.Authorization).toBe('Bearer test-token');
  });

  test('сбрасывает просроченный JWT при ответе 401', async () => {
    localStorage.setItem('token', 'expired-token');
    localStorage.setItem('user', JSON.stringify({ name: 'Фермер' }));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 401,
      json: vi.fn().mockResolvedValue({ error: 'Требуется авторизация' }),
    });

    await expect(apiFetch('/orders')).rejects.toThrow('Требуется авторизация');

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });
});