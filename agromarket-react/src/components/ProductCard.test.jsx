import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProductCard from './ProductCard';

const product = {
  id: 1,
  name: 'Мёд гречишный',
  price: 3500,
  image: '/honey.jpg',
};

describe('ProductCard', () => {
  test('показывает название, цену и изображение товара', () => {
    render(<ProductCard product={product} onAdd={() => {}} />);

    expect(screen.getByText('Мёд гречишный')).toBeInTheDocument();
    expect(screen.getByText('3500 тг')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Мёд гречишный' })).toHaveAttribute('src', '/honey.jpg');
  });

  test('показывает отметку для рекомендуемого товара', () => {
    render(<ProductCard product={product} onAdd={() => {}} featured />);

    expect(screen.getByText('Товар недели')).toBeInTheDocument();
  });

  test('передаёт товар обработчику при добавлении в корзину', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<ProductCard product={product} onAdd={onAdd} />);

    await user.click(screen.getByRole('button', { name: 'В корзину' }));

    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onAdd).toHaveBeenCalledWith(product);
  });
});