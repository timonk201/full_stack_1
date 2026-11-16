import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { apiFetch } from '../api.js';
import AddProductForm from './AddProductForm.jsx';

vi.mock('../api.js', () => ({ apiFetch: vi.fn() }));

describe('AddProductForm', () => {
  beforeEach(() => {
    vi.mocked(apiFetch).mockReset();
  });

  test('показывает детали ошибок валидации от API', async () => {
    const user = userEvent.setup();
    vi.mocked(apiFetch).mockRejectedValue(Object.assign(new Error('Ошибка валидации'), {
      details: [{ field: 'price', message: 'Цена должна быть больше 0' }],
    }));
    render(<AddProductForm onAdded={vi.fn()} />);

    await user.type(screen.getByPlaceholderText('Название'), 'Мёд');
    await user.type(screen.getByPlaceholderText('Цена, ₸'), '0');
    await user.click(screen.getByRole('button', { name: 'Добавить' }));

    expect(await screen.findByText('price: Цена должна быть больше 0')).toBeInTheDocument();
  });
});
