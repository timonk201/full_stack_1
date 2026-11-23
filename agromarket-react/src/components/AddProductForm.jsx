import { useState } from 'react';
import { apiFetch } from '../api.js';
 
export default function AddProductForm({ onAdded }) {
  const [error, setError] = useState('');
  const [details, setDetails] = useState([]);
 
  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setDetails([]);
    const form = e.target;
    const data = Object.fromEntries(new FormData(form));
 
    try {
      const product = await apiFetch('/products', {
        method: 'POST',
        body: JSON.stringify({ ...data, price: Number(data.price) }),
      });
 
      onAdded(product);      // сообщаем App о новом товаре
      form.reset();
    } catch (err) {
      setError(err.message);
      setDetails(err.details || []);
    }
  }
  return (
    <form className="admin-form" aria-label="Новый товар" onSubmit={handleSubmit}>
      <h3>Новый товар</h3>
      <input name="name" placeholder="Название" required />
      <input name="category" placeholder="Категория" />
      <input name="price" type="number" min="0" placeholder="Цена, ₸" required />
      <input name="unit" placeholder="Единица (кг, л)" defaultValue="кг" />
      {error && <p className="error" role="alert">{error}</p>}
      {details.length > 0 && (
        <ul className="error" aria-label="Ошибки валидации">
          {details.map((detail) => (
            <li key={`${detail.field}:${detail.message}`}>
              {detail.field}: {detail.message}
            </li>
          ))}
        </ul>
      )}
      <button type="submit">Добавить</button>
    </form>
  );
}