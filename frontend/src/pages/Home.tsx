import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import type { Product } from '../types';
import { useTelegram } from '../hooks/useTelegram';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useTelegram();

  const { data: newProducts } = useQuery({
    queryKey: ['products', 'new'],
    queryFn: () => api.getProducts({ isNew: 'true', limit: '10' }),
  });

  const { data: hotProducts } = useQuery({
    queryKey: ['products', 'hot'],
    queryFn: () => api.getProducts({ isHot: 'true', limit: '10' }),
  });

  const categories = [
    { key: 'sneakers', label: '👟 Кроссовки' },
    { key: 'clothing', label: '👕 Одежда' },
    { key: 'bags', label: '👜 Сумки' },
  ];

  return (
    <div className="page-scroll">
      {/* Приветствие */}
      <div style={{ padding: '16px 16px 8px' }}>
        <div style={{ fontSize: 13, color: 'var(--tgui--hint_color, #999)', marginBottom: 4 }}>
          {user ? `Привет, ${user.first_name}! 👋` : 'Добро пожаловать!'}
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--tgui--text_color, #000)' }}>
          Urban Shop Moscow
        </div>
        <div style={{ fontSize: 13, color: 'var(--tgui--hint_color, #999)', marginTop: 2 }}>
          Оригинальные кроссовки, одежда и сумки
        </div>
      </div>

      {/* Поиск */}
      <div style={{ padding: '8px 16px 16px' }}>
        <button
          onClick={() => navigate('/catalog?focus=search')}
          style={{
            width: '100%',
            padding: '11px 14px',
            borderRadius: 12,
            border: 'none',
            background: 'var(--tgui--secondary_bg_color, #f4f4f5)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: 'var(--tgui--hint_color, #999)',
            fontSize: 15,
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          Поиск товаров...
        </button>
      </div>

      {/* Категории */}
      <div style={{ padding: '0 16px 16px' }}>
        <SectionTitle title="Категории" />
        <div style={{ display: 'flex', gap: 10 }}>
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => navigate(`/catalog?category=${cat.key}`)}
              style={{
                flex: 1,
                padding: '12px 6px',
                borderRadius: 12,
                border: 'none',
                background: 'var(--tgui--secondary_bg_color, #f4f4f5)',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--tgui--text_color, #000)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span style={{ fontSize: 22 }}>{cat.label.split(' ')[0]}</span>
              <span>{cat.label.split(' ')[1]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Новинки */}
      {newProducts && newProducts.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <SectionTitle
            title="🆕 Новинки"
            action={{ label: 'Все', onClick: () => navigate('/catalog?isNew=true') }}
          />
          <div className="horizontal-scroll">
            {newProducts.map((p) => (
              <HorizontalProductCard key={p.id} product={p} onClick={() => navigate(`/product/${p.id}`)} />
            ))}
          </div>
        </div>
      )}

      {/* Хиты продаж */}
      {hotProducts && hotProducts.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <SectionTitle
            title="🔥 Хиты продаж"
            action={{ label: 'Все', onClick: () => navigate('/catalog?isHot=true') }}
          />
          <div className="horizontal-scroll">
            {hotProducts.map((p) => (
              <HorizontalProductCard key={p.id} product={p} onClick={() => navigate(`/product/${p.id}`)} />
            ))}
          </div>
        </div>
      )}

      {/* Баннер первого заказа */}
      <div style={{ margin: '0 16px 24px' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: 16,
            padding: '16px',
            color: 'white',
          }}
        >
          <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 4 }}>Первый заказ</div>
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Скидка 5% 🎉</div>
          <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 12 }}>
            Используй промокод <b>FIRST5</b> при оформлении
          </div>
          <button
            onClick={() => navigate('/catalog')}
            style={{
              background: 'rgba(255,255,255,0.25)',
              border: 'none',
              borderRadius: 8,
              color: 'white',
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Смотреть каталог →
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({
  title,
  action,
}: {
  title: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px 10px' }}>
      <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--tgui--text_color, #000)' }}>{title}</span>
      {action && (
        <button
          onClick={action.onClick}
          style={{ background: 'none', border: 'none', fontSize: 14, color: 'var(--tgui--button_color, #2481cc)', cursor: 'pointer', fontWeight: 600 }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

function HorizontalProductCard({ product, onClick }: { product: Product; onClick: () => void }) {
  const totalStock = Object.values(product.stockBySize || {}).reduce((a, b) => a + b, 0);
  return (
    <div className="horizontal-card" onClick={onClick}>
      <div style={{ position: 'relative' }}>
        <img
          src={product.images[0] || 'https://placehold.co/140x140/f4f4f5/999?text=Фото'}
          alt={product.name}
          className="horizontal-card__img"
          loading="lazy"
        />
        {product.isNew && (
          <span className="badge badge--new" style={{ position: 'absolute', top: 6, left: 6 }}>NEW</span>
        )}
        {totalStock <= 3 && totalStock > 0 && (
          <span className="badge badge--last" style={{ position: 'absolute', top: 6, right: 6 }}>LAST</span>
        )}
      </div>
      <div style={{ padding: '6px 2px 0' }}>
        <div className="product-card__brand">{product.brand}</div>
        <div className="product-card__name" style={{ fontSize: 12, WebkitLineClamp: 1 }}>{product.name}</div>
        <div className="product-card__price" style={{ fontSize: 13 }}>{product.price.toLocaleString('ru')} ₽</div>
      </div>
    </div>
  );
}
