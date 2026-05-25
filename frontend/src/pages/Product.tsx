import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { useCartStore } from '../store/cart';
import { useTelegram } from '../hooks/useTelegram';
import { convertSize, euToAll, type SizeSystem } from '../utils/sizes';

const BB = "'Bebas Neue', sans-serif";
const IB = "'Inter', sans-serif";

export default function Product() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tg, haptic } = useTelegram();

  const [selectedSize, setSelectedSize] = useState<string | number | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [sizeSystem, setSizeSystem] = useState<SizeSystem>('EU');
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

  useEffect(() => {
    tg?.BackButton.show();
    tg?.BackButton.onClick(() => navigate(-1));
    return () => { tg?.BackButton.hide(); tg?.MainButton.hide(); };
  }, [tg, navigate]);

  const handleAddToCart = useCallback(() => {
    if (!product || !selectedSize) return;
    addItem(product, selectedSize);
    haptic?.notificationOccurred('success');
    setAdded(true);
    tg?.MainButton.setText(`✅ В корзине (${cartCount + 1})`);
    setTimeout(() => { tg?.MainButton.hide(); setAdded(false); }, 2000);
  }, [product, selectedSize, addItem, haptic, tg, cartCount]);

  useEffect(() => {
    if (!tg || !product) return;
    if (selectedSize) {
      tg.MainButton.setText(added ? '✅ Добавлено!' : `В корзину — ${product.price.toLocaleString('ru')} ₽`);
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

  /* ── Loading skeleton ── */
  if (isLoading || !product) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="skeleton" style={{ width: '100%', aspectRatio: '1' }} />
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="skeleton" style={{ height: 12, width: '35%' }} />
          <div className="skeleton" style={{ height: 22, width: '75%' }} />
          <div className="skeleton" style={{ height: 30, width: '40%' }} />
          <div className="skeleton" style={{ height: 44, width: '100%', marginTop: 8 }} />
        </div>
      </div>
    );
  }

  const totalStock = Object.values(product.stockBySize || {}).reduce((a, b) => a + b, 0);
  const isLastUnits = totalStock > 0 && totalStock <= 4;
  const selectedStockLeft = selectedSize !== null ? (product.stockBySize?.[String(selectedSize)] ?? 0) : null;
  const article = product.article || `${product.brand.slice(0, 2).toUpperCase()}${String(product.id).padStart(5, '0')}`;
  const genderLabel = product.gender === 'male' ? "Мужские" : product.gender === 'female' ? "Женские" : "Унисекс";

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* ── Галерея ──────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', flexShrink: 0, background: '#F5F5F5' }}>
        <img
          src={product.images[photoIndex] || 'https://placehold.co/600x600/F5F5F5/888?text=Фото'}
          alt={product.name}
          style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }}
          onClick={() => product.images.length > 1 && setPhotoIndex((i) => (i + 1) % product.images.length)}
        />

        {/* Бейджи */}
        <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 4 }}>
          {product.isNew && <span className="badge badge--new">NEW</span>}
          {product.isHot && <span className="badge badge--hot">HOT</span>}
          {isLastUnits && <span className="badge badge--last">LAST</span>}
        </div>

        {/* Избранное */}
        <button
          onClick={(e) => { e.stopPropagation(); setIsFav(f => !f); haptic?.selectionChanged(); }}
          style={{
            position: 'absolute', top: 10, right: 10,
            width: 36, height: 36, background: '#FFFFFF',
            border: '1px solid #E0E0E0', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
          }}
        >
          {isFav ? '♥' : '♡'}
        </button>

        {/* Миниатюры фото */}
        {product.images.length > 1 && (
          <div style={{ display: 'flex', gap: '1px', background: '#E0E0E0', borderTop: '1px solid #E0E0E0' }}>
            {product.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setPhotoIndex(i)}
                style={{
                  flex: 1, padding: 0, border: 'none', cursor: 'pointer',
                  outline: i === photoIndex ? '2px solid #0A0A0A' : 'none',
                  outlineOffset: -2,
                }}
              >
                <img src={img} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Контент ──────────────────────────────────────────────────── */}
      <div className="page-scroll" style={{ paddingBottom: 100 }}>

        {/* Заголовок */}
        <div style={{ padding: '16px 16px 0', borderBottom: '1px solid #E0E0E0', paddingBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#C9963D', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 4, fontFamily: IB }}>
                {product.brand} · {genderLabel}
              </div>
              <div style={{ fontFamily: BB, fontSize: 26, letterSpacing: '0.02em', color: '#0A0A0A', lineHeight: 1.05, marginBottom: 6 }}>
                {product.name}
              </div>
              {product.colorway && (
                <div style={{ fontSize: 11, color: '#888', fontFamily: IB, letterSpacing: '0.3px' }}>
                  {product.colorway}
                </div>
              )}
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontFamily: BB, fontSize: 28, color: '#0A0A0A', letterSpacing: '0.01em', lineHeight: 1 }}>
                {product.price.toLocaleString('ru')} ₽
              </div>
              <div style={{ fontSize: 9, color: '#888', fontFamily: IB, letterSpacing: '1px', textTransform: 'uppercase', marginTop: 2 }}>
                Арт. {article}
              </div>
            </div>
          </div>

          {/* FOMO */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, fontSize: 11, color: '#888', fontFamily: IB }}>
            <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#4CAF50' }} />
            {fomoCount} человек смотрят прямо сейчас
          </div>
        </div>

        {/* Выбор размера */}
        <div style={{ padding: '14px 16px 0', borderBottom: '1px solid #E0E0E0', paddingBottom: 16 }}>

          {/* Табы системы размеров */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#0A0A0A', fontFamily: IB }}>
              {selectedSize ? `EU ${selectedSize}` : 'Размер'}
            </span>
            <div style={{ display: 'flex', gap: '1px', background: '#E0E0E0' }}>
              {(['EU', 'US', 'UK'] as SizeSystem[]).map(sys => (
                <button
                  key={sys}
                  onClick={() => setSizeSystem(sys)}
                  style={{
                    padding: '5px 12px', border: 'none', cursor: 'pointer',
                    background: sizeSystem === sys ? '#0A0A0A' : '#FFFFFF',
                    color: sizeSystem === sys ? '#FFFFFF' : '#888888',
                    fontSize: 10, fontWeight: 700, letterSpacing: '1px',
                    fontFamily: IB,
                  }}
                >
                  {sys}
                </button>
              ))}
            </div>
          </div>

          {/* Кнопки размеров */}
          <div className="size-grid">
            {product.sizes.map((size) => {
              const stock = product.stockBySize?.[String(size)] ?? 0;
              const isOut = stock === 0;
              const isSelected = selectedSize === size;
              const displaySize = convertSize(size, sizeSystem, product.gender);
              return (
                <button
                  key={String(size)}
                  className={`size-btn ${isSelected ? 'selected' : ''} ${isOut ? 'out-of-stock' : ''}`}
                  onClick={() => { if (isOut) return; setSelectedSize(size); haptic?.selectionChanged(); }}
                  disabled={isOut}
                  style={{ minWidth: 54, position: 'relative' }}
                >
                  {displaySize}
                  {stock <= 2 && stock > 0 && (
                    <span style={{ position: 'absolute', top: 2, right: 2, width: 5, height: 5, borderRadius: '50%', background: '#C62828' }} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Конвертация выбранного размера */}
          {selectedSize && (
            <div style={{ marginTop: 10, padding: '8px 12px', background: '#F5F5F5', borderLeft: '2px solid #C9963D' }}>
              <span style={{ fontSize: 11, fontFamily: IB, color: '#444', letterSpacing: '0.3px' }}>
                {euToAll(selectedSize, product.gender)}
              </span>
            </div>
          )}

          {/* Последние пары */}
          {selectedStockLeft !== null && selectedStockLeft <= 2 && selectedStockLeft > 0 && (
            <div className="urgency-block" style={{ marginTop: 10 }}>
              ⚠️ Осталась {selectedStockLeft === 1 ? 'последняя пара' : `${selectedStockLeft} пары`} размера EU {selectedSize}
            </div>
          )}

          {/* Таблица размеров */}
          <button
            onClick={() => tg?.showAlert(
              'Таблица размеров\n\nEU   US(M)  US(W)  UK\n35   3.5    5      3\n36   4      5.5    3.5\n37   5      6.5    4.5\n38   6      7.5    5.5\n39   7      8.5    6.5\n40   7.5    9      7\n41   8.5    10     8\n42   9      10.5   8.5\n43   10     11.5   9.5\n44   10.5   12     10\n45   11.5   13     11\n46   12.5   14     12'
            )}
            style={{ marginTop: 10, background: 'none', border: 'none', fontSize: 11, fontWeight: 700, color: '#888', cursor: 'pointer', fontFamily: IB, letterSpacing: '0.5px', padding: 0, textDecoration: 'underline' }}
          >
            Таблица размеров →
          </button>
        </div>

        {/* Кнопка "В корзину" для браузера */}
        {!tg && (
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #E0E0E0' }}>
            <button
              onClick={handleAddToCart}
              disabled={!selectedSize}
              className="btn-primary"
            >
              {selectedSize ? `В корзину — ${product.price.toLocaleString('ru')} ₽` : 'Выберите размер'}
            </button>
          </div>
        )}

        {/* Детали товара */}
        <div style={{ borderBottom: '1px solid #E0E0E0' }}>
          <DetailRow label="Бренд" value={product.brand} />
          <DetailRow label="Артикул" value={article} />
          {product.colorway && <DetailRow label="Расцветка" value={product.colorway} />}
          {product.material && <DetailRow label="Материал верха" value={product.material} />}
          <DetailRow label="Категория" value={product.category === 'sneakers' ? 'Кроссовки' : product.category === 'clothing' ? 'Одежда' : 'Сумки'} />
          <DetailRow label="Коллекция" value={product.isNew ? 'Новинка сезона' : 'Актуальная коллекция'} />
        </div>

        {/* Описание */}
        {product.description && (
          <div style={{ padding: '16px', borderBottom: '1px solid #E0E0E0' }}>
            <div style={{ fontFamily: BB, fontSize: 18, letterSpacing: '0.03em', color: '#0A0A0A', marginBottom: 10 }}>
              О товаре
            </div>
            <div style={{ fontSize: 13, color: '#444', lineHeight: 1.7, fontFamily: IB }}>
              {product.description}
            </div>
          </div>
        )}

        {/* Доставка */}
        <div style={{ padding: '16px', borderBottom: '1px solid #E0E0E0' }}>
          <div style={{ fontFamily: BB, fontSize: 18, letterSpacing: '0.03em', color: '#0A0A0A', marginBottom: 12 }}>
            Доставка и оплата
          </div>
          {[
            { icon: '📦', text: 'Доставка по Москве 1–2 дня' },
            { icon: '🚀', text: 'Экспресс-доставка за 3 часа' },
            { icon: '💳', text: 'Оплата при получении или переводом' },
            { icon: '↩️', text: 'Возврат в течение 14 дней' },
            { icon: '✅', text: '100% оригинал — гарантия подлинности' },
          ].map(({ icon, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, fontSize: 13, fontFamily: IB, color: '#444' }}>
              <span style={{ fontSize: 16 }}>{icon}</span>
              {text}
            </div>
          ))}
        </div>

        {/* Похожие товары */}
        {related.length > 0 && (
          <div style={{ paddingTop: 16 }}>
            <div style={{ fontFamily: BB, fontSize: 18, letterSpacing: '0.03em', color: '#0A0A0A', padding: '0 16px 12px' }}>
              С этим берут
            </div>
            <div className="horizontal-scroll">
              {related.map((p) => (
                <div
                  key={p.id}
                  className="horizontal-card"
                  onClick={() => { navigate(`/product/${p.id}`); setPhotoIndex(0); setSelectedSize(null); }}
                >
                  <img
                    src={p.images[0] || 'https://placehold.co/140x140/F5F5F5/888?text=Фото'}
                    alt={p.name}
                    className="horizontal-card__img"
                    loading="lazy"
                  />
                  <div style={{ padding: '6px 6px 0' }}>
                    <div className="product-card__brand">{p.brand}</div>
                    <div style={{ fontSize: 11, fontFamily: IB, color: '#0A0A0A', lineHeight: 1.3, marginBottom: 3 }}>{p.name}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, fontFamily: IB }}>{p.price.toLocaleString('ru')} ₽</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '11px 16px', borderBottom: '1px solid #F0F0F0',
    }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '1px', textTransform: 'uppercase', fontFamily: "'Inter', sans-serif" }}>
        {label}
      </span>
      <span style={{ fontSize: 13, color: '#0A0A0A', fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>
        {value}
      </span>
    </div>
  );
}
