import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import App from '../App.jsx';
import { server } from './server.js';

describe('MSW ответы API', () => {
  test('показывает товары из сетевого обработчика', async () => {
    render(<App />);

    expect(await screen.findByText('Мёд гречишный')).toBeInTheDocument();
    expect(screen.getByText('Картофель молодой')).toBeInTheDocument();
  });

  test('показывает индикатор во время медленной загрузки', () => {
    server.use(http.get('*/api/products', async () => {
      await delay(200);
      return HttpResponse.json([]);
    }));

    render(<App />);

    expect(screen.getByRole('status')).toHaveTextContent(/загрузка товаров/i);
  });

  test('показывает пустой каталог', async () => {
    server.use(http.get('*/api/products', () => HttpResponse.json([])));

    render(<App />);

    expect(await screen.findByText(/товаров пока нет/i)).toBeInTheDocument();
  });

  test('показывает ошибку 500 сервера', async () => {
    server.use(http.get('*/api/products', () =>
      HttpResponse.json({ error: 'Internal' }, { status: 500 }),
    ));

    render(<App />);

    expect(await screen.findByRole('alert')).toHaveTextContent(/не удалось загрузить товары/i);
  });

  test('показывает ответ 429 при входе', async () => {
    server.use(http.post('*/api/auth/login', () =>
      HttpResponse.json(
        { error: 'Слишком много попыток. Попробуйте через 15 минут' },
        { status: 429 },
      ),
    ));
    const user = userEvent.setup();
    render(<App />);

    const loginForm = screen.getByRole('form', { name: 'Вход' });
    await user.type(within(loginForm).getByLabelText(/email/i), 'farmer@agro.kz');
    await user.type(within(loginForm).getByLabelText(/пароль/i), 'secret123');
    await user.click(within(loginForm).getByRole('button', { name: 'Войти' }));

    expect(await screen.findByText(/слишком много попыток/i)).toBeInTheDocument();
  });

  test('успешный вход сохраняет токен', async () => {
    const user = userEvent.setup();
    render(<App />);

    const loginForm = screen.getByRole('form', { name: 'Вход' });
    await user.type(within(loginForm).getByLabelText(/email/i), 'farmer@agro.kz');
    await user.type(within(loginForm).getByLabelText(/пароль/i), 'secret123');
    await user.click(within(loginForm).getByRole('button', { name: 'Войти' }));

    await waitFor(() => expect(localStorage.getItem('token')).toBe('test-token'));
  });

  test('неверный пароль возвращает 401 с текстом сервера', async () => {
    const user = userEvent.setup();
    render(<App />);

    const loginForm = screen.getByRole('form', { name: 'Вход' });
    await user.type(within(loginForm).getByLabelText(/email/i), 'farmer@agro.kz');
    await user.type(within(loginForm).getByLabelText(/пароль/i), 'wrong');
    await user.click(within(loginForm).getByRole('button', { name: 'Войти' }));

    expect(await screen.findByText('Неверный e-mail или пароль')).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBeNull();
  });

  test('во время входа повторная отправка запрещена', async () => {
    server.use(http.post('*/api/auth/login', async () => {
      await delay(200);
      return HttpResponse.json({
        token: 'test-token',
        user: { id: 7, name: 'Айгерим', email: 'farmer@agro.kz', role: 'farmer' },
      });
    }));
    const user = userEvent.setup();
    render(<App />);

    const loginForm = screen.getByRole('form', { name: 'Вход' });
    await user.type(within(loginForm).getByLabelText(/email/i), 'farmer@agro.kz');
    await user.type(within(loginForm).getByLabelText(/пароль/i), 'secret123');
    await user.click(within(loginForm).getByRole('button', { name: 'Войти' }));

    expect(screen.getByRole('button', { name: /подождите/i })).toBeDisabled();
  });

  test('регистрация показывает details с сервера', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /нет аккаунта/i }));
    const registrationForm = screen.getByRole('form', { name: 'Регистрация' });
    await user.type(within(registrationForm).getByLabelText('Имя'), 'Новый пользователь');
    await user.type(within(registrationForm).getByLabelText(/email/i), 'invalid@agromarket.test');
    await user.type(within(registrationForm).getByLabelText(/пароль/i), 'secret123');
    await user.click(within(registrationForm).getByRole('button', { name: 'Зарегистрироваться' }));

    expect(await screen.findByText(/Некорректный e-mail/i)).toBeInTheDocument();
  });

  test('форма добавления товара показывает ошибку цены от сервера', async () => {
    localStorage.setItem('user', JSON.stringify({ name: 'Администратор', role: 'admin' }));
    const user = userEvent.setup();
    render(<App />);

    const productForm = screen.getByRole('form', { name: 'Новый товар' });
    await user.type(within(productForm).getByPlaceholderText('Название'), 'Проверка цены');
    await user.type(within(productForm).getByPlaceholderText('Цена, ₸'), '-500');
    fireEvent.submit(productForm);

    expect(await screen.findByText(/Цена должна быть больше 0/i)).toBeInTheDocument();
  });
});
