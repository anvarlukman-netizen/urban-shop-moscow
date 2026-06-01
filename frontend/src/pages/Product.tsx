import { useState, useEffect, useCallback, useRef } from 'react';
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
  const isInTelegram = Boolean(tg?.initData);

  const [selectedSize, setSelectedSize] = useState<string | number | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [sizeSystem, setSizeSystem] = useState<SizeSystem>('EU');
  const [isFav, setIsFav] = useState(false);
  const [fomoCount] = useState(() => Math.floor(Math.random() * 18) + 5);
  const [added, setAdded] = useState(false);

  // Swipe
  const touchStartX = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent, total: number) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) setPhotoIndex(i => (i + 1) % total);
      else setPhotoIndex(i => (i - 1 + total) % total);
    }
  };

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
    if (!isInTelegram) return;
    tg?.BackButton.show();
    tg?.BackButton.onClick(() => navigate(-1));
    return () => { tg?.BackButton.hide(); tg?.MainButton.hide(); };
  }, [tg, isInTelegram, navigate]);

  const submitRef = useRef<() => void>(() => {});

  const handleAddToCart = useCallback(() => {
    if (!product || !selectedSize) return;
    addItem(product, selectedSize);
    haptic?.notificationOccurred('success');
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }, [product, selectedSize, addItem, haptic]);

  submitRef.current = handleAddToCart;

  useEffect(() => {
    if (!isInTelegram || !tg || !product) return;
    const handler = () => submitRef.current();
    if (selectedSize) {
      tg.MainButton.setText(added ? '✅ Добавлено в корзину!' : `В корзину — ${product.price.toLocaleString('ru')} ₽`);
      tg.MainButton.show();
      tg.MainButton.enable();
      tg.MainButton.onClick(handler);
    } else {
      tg.MainButton.setText('Выберите размер');
      tg.MainButton.show();
      tg.MainButton.disable();
    }
    return () => tg.MainButton.offClick(handler);
  }, [tg, isInTelegram, product, selectedSize, added, cartCount]);

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

  const images = product.images.length > 0 ? product.images : ['https://placehold.co/600x600/F5F5F5/888?text=Фото'];
  const totalStock = Object.values(product.stockBySize || {}).reduce((a, b) => a + b, 0);
  const isLastUnits = totalStock > 0 && totalStock <= 4;
  const selectedStockLeft = selectedSize !== null ? (product.stockBySize?.[String(selectedSize)] ?? 0) : null;
  const article = product.article || `${product.brand.slice(0, 2).toUpperCase()}${String(product.id).padStart(5, '0')}`;
  const genderLabel = product.gender === 'male' ? 'Мужские' : product.gender === 'female' ? 'Женские' : 'Унисекс';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="page-scroll" style={{ paddingBottom: 100 }}>

        {/* ── Галерея ── */}
        <div
          style={{ position: 'relative', background: '#F7F7F7', userSelect: 'none' }}
          onTouchStart={handleTouchStart}
          onTouchEnd={(e) => handleTouchEnd(e, images.length)}
        >
          <img
            src={images[photoIndex]}
            alt={product.name}
            style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }}
          />

          {/* Бейджи */}
          <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {product.isNew && <span className="badge badge--new">NEW</span>}
            {product.isHot && <span className="badge badge--hot">HOT</span>}
            {isLastUnits && <span className="badge badge--last">LAST</span>}
          </div>

          {/* Избранное */}
          <button
            onClick={() => { setIsFav(f => !f); haptic?.selectionChanged(); }}
            style={{
              position: 'absolute', top: 10, right: 10,
              width: 38, height: 38, background: '#FFFFFF',
              borderRadius: '50%', border: '1px solid #E0E0E0',
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 18, boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            }}
          >
            {isFav ? '♥' : '♡'}
          </button>

          {/* Точки-индикаторы */}
          {images.length > 1 && (
            <div style={{ position: 'absolute', bottom: 10, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 5 }}>
              {images.map((_, i) => (
                <div
                  key={i}
                  onClick={() => setPhotoIndex(i)}
                  style={{
                    width: i === photoIndex ? 18 : 6, height: 6,
                    borderRadius: 3, background: i === photoIndex ? '#0A0A0A' : 'rgba(0,0,0,0.25)',
                    transition: 'width 0.2s ease', cursor: 'pointer',
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Миниатюры */}
        {images.length > 1 && (
          <div style={{ display: 'flex', gap: '1px', background: '#E0E0E0', borderBottom: '1px solid #E0E0E0' }}>
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setPhotoIndex(i)}
                style={{
                  flex: 1, padding: 0, border: 'none', cursor: 'pointer',
                  outline: i === photoIndex ? '2px solid #0A0A0A' : 'none',
                  outlineOffset: -2, background: 'none',
                }}
              >
                <img src={img} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
              </button>
            ))}
          </div>
        )}

        {/* ── Бренд + название + цена ── */}
        <div style={{ padding: '16px 16px 14px', borderBottom: '1px solid #EBEBEB' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#C9963D', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 5, fontFamily: IB }}>
            {product.brand} · {genderLabel}
          </div>
          <div style={{ fontFamily: BB, fontSize: 28, letterSpacing: '0.02em', color: '#0A0A0A', lineHeight: 1.05, marginBottom: 10 }}>
            {product.name}
          </div>
          {product.colorway && (
            <div style={{ fontSize: 12, color: '#888', fontFamily: IB, marginBottom: 10 }}>
              {product.colorway}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <div style={{ fontFamily: BB, fontSize: 32, color: '#0A0A0A', letterSpacing: '0.01em', lineHeight: 1 }}>
              {product.price.toLocaleString('ru')} ₽
            </div>
          </div>

          {/* FOMO */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, fontSize: 12, color: '#888', fontFamily: IB }}>
            <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#4CAF50', flexShrink: 0 }} />
            {fomoCount} человек смотрят прямо сейчас
          </div>
        </div>

        {/* ── Выбор размера ── */}
        <div style={{ padding: '14px 16px 16px', borderBottom: '1px solid #EBEBEB' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#0A0A0A', fontFamily: IB }}>
              {selectedSize ? `Размер EU ${selectedSize}` : 'Выберите размер'}
            </span>
            <div style={{ display: 'flex', gap: '1px', background: '#E0E0E0' }}>
              {(['EU', 'US', 'UK'] as SizeSystem[]).map(sys => (
                <button
                  key={sys}
                  onClick={() => setSizeSystem(sys)}
                  style={{
                    padding: '5px 12px', border: 'none', cursor: 'pointer',
                    background: sizeSystem === sys ? '#0A0A0A' : '#FFFFFF',
                    color: sizeSystem === sys ? '#FFFFFF' : '#888',
                    fontSize: 10, fontWeight: 700, letterSpacing: '1px', fontFamily: IB,
                  }}
                >
                  {sys}
                </button>
              ))}
            </div>
          </div>

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

          {selectedSize && (
            <div style={{ marginTop: 10, padding: '8px 12px', background: '#F5F5F5', borderLeft: '2px solid #C9963D' }}>
              <span style={{ fontSize: 11, fontFamily: IB, color: '#444' }}>
                {euToAll(selectedSize, product.gender)}
              </span>
            </div>
          )}

          {selectedStockLeft !== null && selectedStockLeft <= 2 && selectedStockLeft > 0 && (
            <div className="urgency-block" style={{ marginTop: 10 }}>
              ⚠️ Осталась {selectedStockLeft === 1 ? 'последняя пара' : `${selectedStockLeft} пары`} размера EU {selectedSize}
            </div>
          )}

          <button
            onClick={() => tg?.showAlert('Таблица размеров\n\nEU   US(M)  US(W)  UK\n35   3.5    5      3\n36   4      5.5    3.5\n37   5      6.5    4.5\n38   6      7.5    5.5\n39   7      8.5    6.5\n40   7.5    9      7\n41   8.5    10     8\n42   9      10.5   8.5\n43   10     11.5   9.5\n44   10.5   12     10\n45   11.5   13     11\n46   12.5   14     12')}
            style={{ marginTop: 10, background: 'none', border: 'none', fontSize: 11, fontWeight: 700, color: '#888', cursor: 'pointer', fontFamily: IB, letterSpacing: '0.5px', padding: 0, textDecoration: 'underline' }}
          >
            Таблица размеров →
          </button>
        </div>

        {/* ── Кнопка В корзину (браузер / не Telegram) ── */}
        {!isInTelegram && (
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #EBEBEB', display: 'flex', gap: 10 }}>
            <button
              onClick={handleAddToCart}
              disabled={!selectedSize}
              style={{
                flex: 1, padding: '14px 0',
                background: selectedSize ? (added ? '#2E7D32' : '#0A0A0A') : '#CCCCCC',
                color: '#fff', border: 'none', fontSize: 13, fontWeight: 700,
                letterSpacing: '1.5px', textTransform: 'uppercase', cursor: selectedSize ? 'pointer' : 'not-allowed',
                fontFamily: IB, transition: 'background 0.2s',
              }}
            >
              {added ? '✅ ДОБАВЛЕНО' : selectedSize ? 'В КОРЗИНУ' : 'ВЫБЕРИТЕ РАЗМЕР'}
            </button>
            <button
              onClick={() => { setIsFav(f => !f); haptic?.selectionChanged(); }}
              style={{
                width: 50, background: '#F5F5F5', border: '1.5px solid #E0E0E0',
                fontSize: 22, cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              {isFav ? '♥' : '♡'}
            </button>
          </div>
        )}

        {/* ── Гарантии (как на goldapple) ── */}
        <div style={{ padding: '16px', borderBottom: '1px solid #EBEBEB' }}>
          {[
            {
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" strokeWidth={1.5}>
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              ),
              title: 'Люксовая копия',
              sub: 'Только оригинальные материалы',
            },
            {
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" strokeWidth={1.5}>
                  <rect x="1" y="3" width="22" height="13" rx="2"/>
                  <path d="M16 21H8M12 17v4"/>
                </svg>
              ),
              title: 'Бесплатная доставка',
              sub: 'При заказе от 10 000 ₽',
            },
            {
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" strokeWidth={1.5}>
                  <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.51"/>
                </svg>
              ),
              title: 'Возврат 14 дней',
              sub: 'Без объяснения причин',
            },
          ].map(({ icon, title, sub }) => (
            <div key={title} style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
              <div style={{
                width: 46, height: 46, borderRadius: '50%', border: '1.5px solid #E0E0E0',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                {icon}
              </div>
              <div>
                <div style={{ fontFamily: IB, fontSize: 13, fontWeight: 700, color: '#0A0A0A', marginBottom: 2 }}>{title}</div>
                <div style={{ fontFamily: IB, fontSize: 12, color: '#888' }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Описание ── */}
        {product.description && (
          <div style={{ padding: '16px', borderBottom: '1px solid #EBEBEB' }}>
            <div style={{ fontFamily: BB, fontSize: 20, letterSpacing: '0.03em', color: '#0A0A0A', marginBottom: 10 }}>
              О товаре
            </div>
            <div style={{ fontSize: 13, color: '#555', lineHeight: 1.75, fontFamily: IB }}>
              {product.description}
            </div>
          </div>
        )}

        {/* ── Детали ── */}
        <div style={{ borderBottom: '1px solid #EBEBEB' }}>
          <DetailRow label="Бренд" value={product.brand} />
          <DetailRow label="Артикул" value={article} />
          {product.colorway && <DetailRow label="Расцветка" value={product.colorway} />}
          {product.material && <DetailRow label="Материал" value={product.material} />}
          <DetailRow label="Категория" value={product.category === 'sneakers' ? 'Кроссовки' : product.category === 'clothing' ? 'Одежда' : 'Сумки'} />
          <DetailRow label="Коллекция" value={product.isNew ? 'Новинка сезона' : 'Актуальная коллекция'} />
        </div>

        {/* ── Похожие ── */}
        {related.length > 0 && (
          <div style={{ paddingTop: 16 }}>
            <div style={{ fontFamily: BB, fontSize: 20, letterSpacing: '0.03em', color: '#0A0A0A', padding: '0 16px 12px' }}>
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
      <span style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '1px', textTransform: 'uppercase', fontFamily: IB }}>
        {label}
      </span>
      <span style={{ fontSize: 13, color: '#0A0A0A', fontFamily: IB, fontWeight: 500 }}>
        {value}
      </span>
    </div>
  );
}
