import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Имя — минимум 2 символа').max(100),
  email: z.string().trim().toLowerCase().email('Некорректный e-mail').max(254),
  password: z.string().min(8, 'Пароль — минимум 8 символов').max(72),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Некорректный e-mail').max(254),
  password: z.string().min(1, 'Пароль обязателен').max(72),
});

export const productSchema = z.object({
  name: z.string().trim().min(2, 'Название — минимум 2 символа').max(200),
  price: z.coerce.number().int().positive('Цена должна быть больше 0').max(10_000_000),
  category: z.string().trim().max(50).nullable().optional(),
  unit: z.string().trim().min(1).max(30).optional(),
  image: z.string().trim().max(2048).nullable().optional(),
});

export const productUpdateSchema = productSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, 'Нет полей для обновления');
