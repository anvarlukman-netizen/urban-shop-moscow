import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { useCartStore } from '../store/cart';
import { useTelegram } from '../hooks/useTelegram';

export default function Product() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tg, haptic } = useTelegram();

  const [selectedSize, setSelectedSize] = useState<string | number | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [isFav, setIsFav] = useState(false);
  const [fomoCount] = useState(() => Math.floor(Math.random() * 18) + 5);
  const [added, setAdded] = useState(false);

  const addItem = useCartStore((s) => s.addItem);
  const cartCount = useCartStore((s) => s.count());

  const { data, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => api.getProduct(Number(id)),
    enabled: !!id,
  });

  const product = data?.product;
  const related = data?.related ?? [];

  // Показываем BackButton и MainButton
  useEffect(() => {
    tg?.BackButton.show();
    tg?.BackButton.onClick(() => navigate(-1));
    return () => {
      tg?.BackButton.hide();
      tg?.MainButton.hide();
    };
  }, [tg, navigate]);

  const handleAddToCart = useCallback(() => {
    if (!product || !selectedSize) return;
    addItem(product, selectedSize);
    haptic?.notificationOccurred('success');
    setAdded(true);
    tg?.MainButton.setText(`✅ В корзине (${cartCount + 1})`);
    setTimeout(() => {
      tg?.MainButton.hide();
      setAdded(false);
    }, 2000);
  }, [product, selectedSize, addItem, haptic, tg, cartCount]);

  // MainButton
  useEffect(() => {
    if (!tg || !product) return;
    if (selectedSize) {
      tg.MainButton.setText(added ? `✅ Добавлено!` : `В корзину — ${product.price.toLocaleString('ru')} ₽`);
      tg.MainButton.show();
      tg.MainButton.enable();
      tg.MainButton.onClick(handleAddToCart);
    } else {
      tg.MainButton.setText('Выберите размер');
      tg.MainButton.show();
      tg.MainButton.disable();
    }
    return () => tg.MainButton.offClick(handleAddToCart);
  }, [tg, product, selectedSize, added, handleAddToCart]);

  if (isLoading || !product) {
    return (
      <div className="page-scroll">
        <div className="skeleton" style={{ width: '100%', aspectRatio: '1' }} />
        <div style={{ padding: 16 }}>
          <div className="skeleton" style={{ height: 14, width: '40%', marginBottom: 8, borderRadius: 6 }} />
          <div className="skeleton" style={{ height: 24, width: '80%', marginBottom: 16, borderRadius: 6 }} />
          <div className="skeleton" style={{ height: 32, width: '30%', marginBottom: 24, borderRadius: 6 }} />
        </div>
      </div>
    );
  }

  const totalStock = Object.values(product.stockBySize || {}).reduce((a, b) => a + b, 0);
  const isLastUnits = totalStock > 0 && totalStock <= 4;
  const selectedStockLeft = selectedSize !== null
    ? (product.stockBySize?.[String(selectedSize)] ?? 0)
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Галерея фото */}
      <div
        className="photo-gallery"
        style={{ flexShrink: 0 }}
        onClick={() => setPhotoIndex((i) => (i + 1) % product.images.length)}
      >
        <img
          src={product.images[photoIndex] || 'https://placehold.co/600x600/f4f4f5/999?text=Фото'}
          alt={product.name}
          className="photo-gallery__img"
        />
        {/* Бейджи */}
        <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 6 }}>
          {product.isNew && <span className="badge badge--new">NEW</span>}
          {product.isHot && <span className="badge badge--hot">HOT</span>}
        </div>
        {/* Кнопка избранного */}
        <button
          onClick={(e) => { e.stopPropagation(); setIsFav((f) => !f); haptic?.selectionChanged(); }}
          style={{
            position: 'absolute', top: 10, right: 12,
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(255,255,255,0.85)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18,
          }}
        >
          {isFav ? '❤️' : '🤍'}
        </button>
        {/* Dots */}
        {product.images.length > 1 && (
          <div className="photo-dots">
            {product.images.map((_, i) => (
              <div key={i} className={`photo-dot ${i === photoIndex ? 'active' : ''}`} />
            ))}
          </div>
        )}
      </div>

      {/* Контент */}
      <div className="page-scroll" style={{ paddingBottom: 90 }}>
        <div style={{ padding: '14px 16px 0' }}>
          {/* Бренд + название */}
          <div style={{ fontSize: 12, color: 'var(--tgui--button_color, #2481cc)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
            {product.brand}
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--tgui--text_color, #000)', marginBottom: 4, lineHeight: 1.3 }}>
            {product.name}
          </div>

          {/* Цена */}
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--tgui--text_color, #000)', marginBottom: 12 }}>
            {product.price.toLocaleString('ru')} ₽
          </div>

          {/* FOMO + urgency */}
          <div className="fomo-block">
            <span>👁</span>
            <span>{fomoCount} человек смотрят прямо сейчас</span>
          </div>

          {isLastUnits && (
            <div className="urgency-block">
              <span>⚠️</span>
              <span>Осталось всего {totalStock} {totalStock === 1 ? 'пара' : 'пары'}!</span>
            </div>
          )}
        </div>

        {/* Выбор размера */}
        <div style={{ padding: '12px 16px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--tgui--text_color, #000)' }}>
              {selectedSize ? `Размер: ${selectedSize}` : 'Выберите размер'}
            </span>
            <button
              style={{ background: 'none', border: 'none', fontSize: 13, color: 'var(--tgui--button_color, #2481cc)', cursor: 'pointer', fontWeight: 600 }}
              onClick={() => {
                tg?.showAlert('Размерная таблица:\n\n36 — EU 36\n37 — EU 37\n38 — EU 38\n39 — EU 39\n40 — EU 40\n41 — EU 41\n42 — EU 42\n43 — EU 43\n44 — EU 44\n45 — EU 45');
              }}
            >
              Таблица размеров
            </button>
          </div>
          <div className="size-grid">
            {product.sizes.map((size) => {
              const stock = product.stockBySize?.[String(size)] ?? 0;
              const isOut = stock === 0;
              const isSelected = selectedSize === size;
              return (
                <button
                  key={String(size)}
                  className={`size-btn ${isSelected ? 'selected' : ''} ${isOut ? 'out-of-stock' : ''}`}
                  onClick={() => {
                    if (isOut) return;
                    setSelectedSize(size);
                    haptic?.selectionChanged();
                  }}
                  disabled={isOut}
                >
                  {size}
                </button>
              );
            })}
          </div>
          {selectedStockLeft !== null && selectedStockLeft <= 2 && selectedStockLeft > 0 && (
            <div className="urgency-block" style={{ marginTop: 10 }}>
              <span>⚠️</span>
              <span>Осталась {selectedStockLeft === 1 ? 'последняя пара' : `${selectedStockLeft} пары`} размера {selectedSize}!</span>
            </div>
          )}
        </div>

        {/* Кнопка "В корзину" для браузера (если не в Telegram) */}
        {!tg && (
          <div style={{ padding: '16px 16px 0' }}>
            <button
              onClick={handleAddToCart}
              disabled={!selectedSize}
              style={{
                width: '100%', padding: '14px', borderRadius: 12,
                background: selectedSize ? 'var(--tgui--button_color, #2481cc)' : '#ccc',
                color: 'white', border: 'none', fontSize: 16, fontWeight: 700, cursor: selectedSize ? 'pointer' : 'not-allowed',
              }}
            >
              {selectedSize ? `В корзину — ${product.price.toLocaleString('ru')} ₽` : 'Выберите размер'}
            </button>
          </div>
        )}

        {/* Описание */}
        {product.description && (
          <div style={{ padding: '16px 16px 0' }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: 'var(--tgui--text_color, #000)' }}>О товаре</div>
            <div style={{ fontSize: 14, color: 'var(--tgui--hint_color, #666)', lineHeight: 1.6 }}>
              {product.description}
            </div>
          </div>
        )}

        {/* Похожие товары */}
        {related.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <div style={{ padding: '0 16px 10px', fontSize: 17, fontWeight: 700, color: 'var(--tgui--text_color, #000)' }}>
              С этим берут
            </div>
            <div className="horizontal-scroll">
              {related.map((p) => (
                <div key={p.id} className="horizontal-card" onClick={() => { navigate(`/product/${p.id}`); setPhotoIndex(0); setSelectedSize(null); }}>
                  <img src={p.images[0] || 'https://placehold.co/140x140/f4f4f5/999?text=Фото'} alt={p.name} className="horizontal-card__img" loading="lazy" />
                  <div style={{ padding: '6px 2px 0' }}>
                    <div className="product-card__brand">{p.brand}</div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--tgui--text_color)' }}>{p.name}</div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{p.price.toLocaleString('ru')} ₽</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ height: 16 }} />
      </div>
    </div>
  );
}
