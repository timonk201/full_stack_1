import { useState } from 'react';

function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    payload.volume = Number(payload.volume);
    payload.deliveryDate = payload['delivery-date'];
    delete payload['delivery-date'];

    setIsSubmitting(true);
    setSubmitError('');
    setIsSubmitted(false);

    try {
      const response = await fetch('http://localhost:3000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Не удалось отправить заявку');
      }

      form.reset();
      setIsSubmitted(true);
    } catch (error) {
      setSubmitError(error.message || 'Не удалось связаться с сервером');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section id="contact" className="contact">
      <h2>Оптовая заявка</h2>

      <form className="contact-form" onSubmit={handleSubmit}>
        <label htmlFor="name">Имя / организация</label>
        <input id="name" name="name" type="text" required />

        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="farmer@mail.kz"
        />

        <label htmlFor="phone">Телефон</label>
        <input
          id="phone"
          name="phone"
          type="tel"
          placeholder="+7 7XX XXX XX XX"
          required
        />

        <label htmlFor="volume">Объём заказа, кг</label>
        <input
          id="volume"
          name="volume"
          type="number"
          min="10"
          required
        />

        <label htmlFor="delivery-date">Желаемая дата доставки</label>
        <input id="delivery-date" name="delivery-date" type="date" required />

        <label htmlFor="comment">Комментарий</label>
        <textarea id="comment" name="comment" rows="4" />

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Отправка...' : 'Отправить заявку'}
        </button>
        {submitError && <p role="alert">{submitError}</p>}
        {isSubmitted && <p role="status">Заявка отправлена! Мы свяжемся с вами.</p>}
      </form>
    </section>
  );
}

export default ContactForm;
