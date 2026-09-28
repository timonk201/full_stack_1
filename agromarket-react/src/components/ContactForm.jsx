function ContactForm() {
  function handleSubmit(e) {
    e.preventDefault();
    alert('Заявка отправлена! Мы свяжемся с вами.');
    e.target.reset();
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

        <button type="submit">Отправить заявку</button>
      </form>
    </section>
  );
}

export default ContactForm;
