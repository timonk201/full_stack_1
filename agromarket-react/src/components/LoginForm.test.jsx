import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { apiFetch } from '../api.js';
import LoginForm from './LoginForm';

vi.mock('../api.js', () => ({ apiFetch: vi.fn() }));

describe('LoginForm', () => {
  beforeEach(() => {
    vi.mocked(apiFetch).mockReset();
  });

  test('отправляет введённые email и пароль и передаёт ответ в onLogin', async () => {
    const user = userEvent.setup();
    const onLogin = vi.fn();
    const account = { name: 'Фермер', role: 'farmer' };
    vi.mocked(apiFetch).mockResolvedValue({ user: account, token: 'jwt-token' });
    render(<LoginForm onLogin={onLogin} />);

    await user.type(screen.getByLabelText(/email/i), 'farmer@agromarket.kz');
    await user.type(screen.getByLabelText(/пароль/i), 'secret123');
    await user.click(screen.getByRole('button', { name: 'Войти' }));

    expect(apiFetch).toHaveBeenCalledWith('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'farmer@agromarket.kz', password: 'secret123' }),
    });
    expect(onLogin).toHaveBeenCalledTimes(1);
    expect(onLogin).toHaveBeenCalledWith(account, 'jwt-token');
  });

  test('отправляет имя при регистрации', async () => {
    const user = userEvent.setup();
    vi.mocked(apiFetch).mockResolvedValue({ user: { name: 'Новый фермер' }, token: 'new-token' });
    render(<LoginForm onLogin={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /нет аккаунта/i }));
    await user.type(screen.getByLabelText('Имя'), 'Новый фермер');
    await user.type(screen.getByLabelText(/email/i), 'new@agromarket.kz');
    await user.type(screen.getByLabelText(/пароль/i), 'secret123');
    await user.click(screen.getByRole('button', { name: 'Зарегистрироваться' }));

    expect(apiFetch).toHaveBeenCalledWith('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Новый фермер', email: 'new@agromarket.kz', password: 'secret123' }),
    });
  });

  test('показывает сообщение при ошибке API', async () => {
    const user = userEvent.setup();
    vi.mocked(apiFetch).mockRejectedValue(new Error('Неверные данные'));
    render(<LoginForm onLogin={vi.fn()} />);

    await user.type(screen.getByLabelText(/email/i), 'farmer@agromarket.kz');
    await user.type(screen.getByLabelText(/пароль/i), 'secret123');
    await user.click(screen.getByRole('button', { name: 'Войти' }));

    expect(await screen.findByText('Неверные данные')).toBeInTheDocument();
  });

  test('не отправляет некорректный email', async () => {
    const user = userEvent.setup();
    render(<LoginForm onLogin={vi.fn()} />);

    await user.type(screen.getByLabelText(/email/i), 'not-an-email');
    await user.type(screen.getByLabelText(/пароль/i), 'secret123');
    await user.click(screen.getByRole('button', { name: 'Войти' }));

    expect(apiFetch).not.toHaveBeenCalled();
  });
});