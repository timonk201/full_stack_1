import { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import ProductCard from './components/ProductCard';
import ContactForm from './components/ContactForm';
import LoginForm from './components/LoginForm.jsx';
import AddProductForm from './components/AddProductForm.jsx';
import { API_URL, apiFetch } from './api.js';

function App() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cartCount, setCartCount] = useState(0);
  
  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await fetch(`${API_URL}/products`);
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error('Ошибка при загрузке товаров:', error);
      }
    }
    loadProducts();
  }, []);

  const [user, setUser] = useState(
    () => JSON.parse(localStorage.getItem('user') || 'null')
  );

  useEffect(() => {
    if (!localStorage.getItem('token')) return;

    apiFetch('/auth/me').then(setUser).catch(() => {});
  }, []);
  
  function handleLogin(user, token) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
  }
  
  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }

  function handleAddToCart() {
    setCartCount((current) => current + 1);
  }

  const featuredProductId = products[0]?.id ?? 1;

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Header cartCount={cartCount} />
      <div className="auth-bar">
        <div className="auth-content">
          {user ? (
            <div className="auth-user">
              <span>Вы вошли как <b>{user.name}</b> ({user.role})</span>
              <button onClick={handleLogout}>Выйти</button>
            </div>
          ) : (
            <LoginForm onLogin={handleLogin} />
          )}
        </div>
      </div>

      <main className="page">
        <div className="catalog-stack">
          {user?.role === 'admin' && (
            <AddProductForm onAdded={(p) => setProducts([...products, p])} />
          )}
          <section id="catalog" className="catalog">
            <div className="catalog-toolbar">
              <h2>Каталог</h2>

              <input
                type="search"
                placeholder="Поиск товара..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="product-grid">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAdd={handleAddToCart}
                  featured={product.id === featuredProductId}
                />
              ))}
            </div>
          </section>
        </div>

        <aside id="delivery" className="sidebar">
          <h3>Доставка</h3>
          <ul>
            <li>Астана — на следующий день</li>
            <li>Акмолинская область — 2–3 дня</li>
            <li>Бесплатно от 20 000 тг</li>
          </ul>
        </aside>

        <ContactForm />
      </main>

      <Footer />
    </>
  );
}

export default App;