function ProductCard({ product, onAdd }) {
  return (
    <article className="skill-card">
      <img src={product.image} alt={product.name} style={{ width: '100%', borderRadius: '8px' }} /> 
      <h3>{product.name}</h3>
      <p>{product.price} тг</p>
      <button onClick={() => onAdd(product)}>В корзину</button>
    </article>
  );
}

export default ProductCard;