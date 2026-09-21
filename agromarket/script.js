async function loadProducts() {
  const response = await fetch('http://localhost:3001/products');
  const products = await response.json();
  renderProducts(products);
}

function renderProducts(products) {
  const catalog = document.querySelector('.catalog');
  products.forEach((product) => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}">
      <h3>${product.name}</h3>
      <p>${product.price} тг</p>
      <button>В корзину</button>
    `;
    catalog.appendChild(card);
  });
}

loadProducts();
