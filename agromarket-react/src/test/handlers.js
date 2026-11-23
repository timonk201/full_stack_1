import { http, HttpResponse } from 'msw';

export const products = [
  { id: 1, name: 'Мёд гречишный', price: 3500, category: 'Мёд', image: '/honey.jpg' },
  { id: 2, name: 'Картофель молодой', price: 250, category: 'Овощи', image: '/potato.jpg' },
];

export const handlers = [
  http.get('*/api/products', () => HttpResponse.json(products)),
  http.post('*/api/auth/login', async ({ request }) => {
    const { email, password } = await request.json();

    if (password === 'secret123') {
      return HttpResponse.json({
        token: 'test-token',
        user: { id: 7, name: 'Айгерим', email, role: 'farmer' },
      });
    }

    return HttpResponse.json(
      { error: 'Неверный e-mail или пароль' },
      { status: 401 },
    );
  }),
  http.post('*/api/auth/register', async ({ request }) => {
    const { email } = await request.json();

    if (email === 'invalid@agromarket.test') {
      return HttpResponse.json(
        {
          error: 'Ошибка валидации',
          details: [{ field: 'email', message: 'Некорректный e-mail' }],
        },
        { status: 400 },
      );
    }

    return HttpResponse.json({
      token: 'registered-token',
      user: { id: 8, name: 'Новый пользователь', email, role: 'buyer' },
    });
  }),
  http.post('*/api/products', async ({ request }) => {
    const product = await request.json();

    if (Number(product.price) < 0) {
      return HttpResponse.json(
        {
          error: 'Ошибка валидации',
          details: [{ field: 'price', message: 'Цена должна быть больше 0' }],
        },
        { status: 400 },
      );
    }

    return HttpResponse.json({ id: 99, ...product }, { status: 201 });
  }),
];
