import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import type { Product } from '../types';

export default function Favourites() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ['favourites'],
    queryFn: api.getFavourites,
  });

  const toggle = useMutation({
    mutationFn: api.toggleFavourite,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favourites'] }),
  });

  if (isLoading) {
    return (
      <div className="page-scroll">
        <div style={{ padding: '16px 16px 20px', fontSize: 20, fontWeight: 700 }}>Избранное</div>
        <div className="catalog-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <div className="skeleton" style={{ width: '100%', aspectRatio: '1', borderRadius: 12 }} />
              <div className="skeleton" style={{ height: 14, marginTop: 8, width: '70%', borderRadius: 6 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="page-scroll" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🤍</div>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: 'var(--tgui--text_color)' }}>Пусто</div>
        <div style={{ fontSize: 14, color: 'var(--tgui--hint_color)', marginBottom: 24 }}>Добавляй товары в избранное нажав ❤️</div>
        <button
          onClick={() => navigate('/catalog')}
          style={{
            padding: '12px 28px', borderRadius: 12, border: 'none',
            background: 'var(--tgui--button_color, #2481cc)',
            color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer',
          }}
        >
          Перейти в каталог
        </button>
      </div>
    );
  }

  return (
    <div className="page-scroll">
      <div style={{ padding: '16px 16px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--tgui--text_color)' }}>Избранное</div>
        <div style={{ fontSize: 13, color: 'var(--tgui--hint_color)' }}>{products.length} {products.length === 1 ? 'товар' : 'товара'}</div>
      </div>
      <div className="catalog-grid">
        {products.map((p) => (
          <FavCard
            key={p.id}
            product={p}
            onOpen={() => navigate(`/product/${p.id}`)}
            onRemove={() => toggle.mutate(p.id)}
          />
        ))}
      </div>
      <div style={{ height: 16 }} />
    </div>
  );
}

function FavCard({ product, onOpen, onRemove }: { product: Product; onOpen: () => void; onRemove: () => void }) {
  return (
    <div className="product-card" style={{ position: 'relative' }}>
      <div onClick={onOpen}>
        <img
          src={product.images[0] || 'https://placehold.co/300x300/f4f4f5/999?text=Фото'}
          alt={product.name}
          className="product-card__image"
          loading="lazy"
        />
      </div>
      <button
        onClick={onRemove}
        style={{
          position: 'absolute', top: 6, right: 6,
          width: 30, height: 30, borderRadius: '50%',
          background: 'rgba(255,255,255,0.85)', border: 'none',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
        }}
      >
        ❤️
      </button>
      <div className="product-card__body" onClick={onOpen}>
        <div className="product-card__brand">{product.brand}</div>
        <div className="product-card__name">{product.name}</div>
        <div className="product-card__price">{product.price.toLocaleString('ru')} ₽</div>
      </div>
    </div>
  );
}
