import { Router } from 'express';
import { products } from '../data/products.js';

export const productsRouter = Router();

export function searchProducts(search = '') {
  const normalizedSearch = typeof search === 'string' ? search.trim().toLowerCase() : '';
  return products.filter((product) => product.name.toLowerCase().includes(normalizedSearch));
}

productsRouter.get('/', (req, res) => {
  res.json(searchProducts(req.query.search));
});

productsRouter.get('/:id', (req, res) => {
  const product = products.find((item) => String(item.id) === req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Товар не найден' });
  }

  res.json(product);
});