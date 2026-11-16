import { rateLimit } from 'express-rate-limit';

function createAuthLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    skipSuccessfulRequests: true,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Слишком много попыток. Попробуйте через 15 минут' },
    skip: () => process.env.NODE_ENV === 'test',
  });
}

export const loginLimiter = createAuthLimiter();
export const registerLimiter = createAuthLimiter();
