import { describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { requireAuth, requireRole } from '../middleware/auth.js';

function mockRes() {
  const response = {};
  response.status = vi.fn(() => response);
  response.json = vi.fn(() => response);
  return response;
}

describe('requireRole', () => {
  it('пропускает нужную роль', () => {
    const req = { user: { id: 1, role: 'admin' } };
    const res = mockRes();
    const next = vi.fn();
    requireRole('admin')(req, res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('другой роли отвечает 403 и не вызывает next', () => {
    const req = { user: { id: 2, role: 'user' } };
    const res = mockRes();
    const next = vi.fn();
    requireRole('admin')(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('requireAuth', () => {
  it('без Authorization отвечает 401', () => {
    const res = mockRes();
    const next = vi.fn();
    requireAuth({ headers: {} }, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('с верным токеном заполняет req.user', () => {
    const token = jwt.sign({ sub: '7', role: 'user' }, process.env.JWT_SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const next = vi.fn();
    requireAuth(req, mockRes(), next);
    expect(next).toHaveBeenCalledOnce();
    expect(req.user).toEqual({ id: 7, role: 'user' });
  });

  it('истёкший токен отвечает 401 с сообщением о сроке действия', () => {
    const token = jwt.sign(
      { sub: '7', role: 'user', exp: Math.floor(Date.now() / 1000) - 60 },
      process.env.JWT_SECRET,
    );
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = vi.fn();
    requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json.mock.calls[0][0].error).toMatch(/истёк/i);
    expect(next).not.toHaveBeenCalled();
  });
});