import { render, screen } from '@testing-library/react';
import App from './App';

function mockProductsResponse(body, status = 200) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  });
}

describe('каталог в App', () => {
  test('показывает загрузку, затем полученные товары', async () => {
    mockProductsResponse([
      { id: 1, name: 'Мёд гречишный', price: 3500, image: '/honey.jpg' },
    ]);
    render(<App />);

    expect(screen.getByRole('status')).toHaveTextContent(/загрузка товаров/i);
    expect(await screen.findByText('Мёд гречишный')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  test('запрашивает товары по адресу API каталога', async () => {
    const fetchSpy = mockProductsResponse([]);
    render(<App />);

    await screen.findByText('Товаров пока нет.');

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith(expect.stringMatching(/\/api\/products$/));
  });

  test('показывает пустое состояние, если сервер вернул пустой список', async () => {
    mockProductsResponse([]);
    render(<App />);

    expect(await screen.findByText('Товаров пока нет.')).toBeInTheDocument();
  });

  test('показывает ошибку при ответе сервера с ошибкой', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockProductsResponse({ error: 'Ошибка сервера' }, 500);
    render(<App />);

    expect(await screen.findByRole('alert')).toHaveTextContent(/не удалось загрузить товары/i);
  });

  test('показывает ошибку, если запрос завершился сетевой ошибкой', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
    render(<App />);

    expect(await screen.findByRole('alert')).toHaveTextContent(/не удалось загрузить товары/i);
  });
});