import { useState } from 'react';
import { apiFetch } from '../api.js';
export default function LoginForm({ onLogin }) {
  const [mode, setMode] = useState('login');      // 'login' или 'register'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
 
  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const data = Object.fromEntries(new FormData(e.target));
 
    try {
      // /auth/login или /auth/register — оба возвращают { user, token }
      const result = await apiFetch(`/auth/${mode}`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      onLogin(result.user, result.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
 
  const isLogin = mode === 'login';
 
  return (
    <form className="login-form" aria-label={isLogin ? 'Вход' : 'Регистрация'} onSubmit={handleSubmit}>
      <h3>{isLogin ? 'Вход' : 'Регистрация'}</h3>
 
      {!isLogin && (
        <>
          <label className="visually-hidden" htmlFor="login-name">Имя</label>
          <input id="login-name" name="name" placeholder="Имя" required />
        </>
      )}
      <label className="visually-hidden" htmlFor="login-email">Email</label>
      <input id="login-email" name="email" type="email" placeholder="Email" required />
      <label className="visually-hidden" htmlFor="login-password">Пароль</label>
      <input id="login-password" name="password" type="password" placeholder="Пароль (от 8 символов)"
             required minLength={8} />
 
      {error && <p className="error">{error}</p>}
 
      <button type="submit" disabled={loading}>
        {loading ? 'Подождите…' : isLogin ? 'Войти' : 'Зарегистрироваться'}
      </button>
      <button type="button" onClick={() => setMode(isLogin ? 'register' : 'login')}>
        {isLogin ? 'Нет аккаунта? Регистрация' : 'Уже есть аккаунт? Войти'}
      </button>
    </form>
  );
}