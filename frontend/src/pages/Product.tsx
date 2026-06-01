import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { useCartStore } from '../store/cart';
import { useTelegram } from '../hooks/useTelegram';
import { convertSize, euToAll, type SizeSystem } from '../utils/sizes';

const IB = "'Inter', sans-serif";
const BB = "'Bebas Neue', sans-serif";

/* ── Star rating ── */
function Stars({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', gap: 1 }}>
      {[1, 2, 3, 4, 5].map((n) => {
        const full = rating >= n;
        const half = !full && rating >= n - 0.5;
        return (
          <svg key={n} width="13" height="13" viewBox="0 0 24 24">
            {half ? (
              <>
                <defs>
                  <linearGradient id={`h${n}`}>
                    <stop offset="50%" stopColor="#F4B942" />
                    <stop offset="50%" stopColor="#E0E0E0" />
                  </linearGradient>
                </defs>
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill={`url(#h${n})`} />
              </>
            ) : (
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill={full ? '#F4B942' : '#E0E0E0'} />
            )}
          </svg>
        );
      })}
    </div>
  );
}

export default function Product() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tg, haptic } = useTelegram();
  const isInTelegram = Boolean(tg?.initData);

  const [selectedSize, setSelectedSize] = useState<string | number | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [sizeSystem, setSizeSystem] = useState<SizeSystem>('EU');
  const [isFav, setIsFav] = useState(false);
  const [added, setAdded] = useState(false);
  const [fomoCount] = useState(() => Math.floor(Math.random() * 18) + 5);
  // Static review data per product (seeded by id)
  const [reviewData] = useState(() => {
    const seed = Number(id) || 1;
    const rating = 4.5 + (seed % 3) * 0.1; // 4.5–4.7
    const count = 12 + (seed * 7) % 88;     // 12–99
    return { rating: Math.min(rating, 5), count };
  });

  // Swipe
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e: React.TouchEvent, total: number) => {
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    const dy = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      if (dx > 0) setPhotoIndex(i => (i + 1) % total);
      else setPhotoIndex(i => (i - 1 + total) % total);
    }
  };

  const addItem = useCartStore((s) => s.addItem);

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
      tg.MainButton.setText(added ? '✅ Добавлено!' : `В корзину — ${product.price.toLocaleString('ru')} ₽`);
      tg.MainButton.show(); tg.MainButton.enable(); tg.MainButton.onClick(handler);
    } else {
      tg.MainButton.setText('Выберите размер');
      tg.MainButton.show(); tg.MainButton.disable();
    }
    return () => tg.MainButton.offClick(handler);
  }, [tg, isInTelegram, product, selectedSize, added]);

  /* ── Skeleton ── */
  if (isLoading || !product) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="skeleton" style={{ width: '100%', paddingBottom: '110%' }} />
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="skeleton" style={{ height: 10, width: '30%', borderRadius: 4 }} />
          <div className="skeleton" style={{ height: 24, width: '70%', borderRadius: 4 }} />
          <div className="skeleton" style={{ height: 32, width: '40%', borderRadius: 4, marginTop: 4 }} />
          <div className="skeleton" style={{ height: 48, width: '100%', borderRadius: 6, marginTop: 12 }} />
        </div>
      </div>
    );
  }

  const images = product.images.filter(Boolean);
  if (!images.length) images.push('https://placehold.co/600x700/F5F5F5/CCCCCC?text=Фото');

  const totalStock = Object.values(product.stockBySize || {}).reduce((a, b) => a + b, 0);
  const isLastUnits = totalStock > 0 && totalStock <= 4;
  const selectedStockLeft = selectedSize !== null ? (product.stockBySize?.[String(selectedSize)] ?? 0) : null;
  const article = product.article || `${product.brand.slice(0, 2).toUpperCase()}${String(product.id).padStart(5, '0')}`;
  const genderLabel = { male: 'Мужские', female: 'Женские', unisex: 'Унисекс' }[product.gender];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="page-scroll" style={{ paddingBottom: 100 }}>

        {/* ══ ГАЛЕРЕЯ ══════════════════════════════════════════════════════ */}
        <div
          style={{ position: 'relative', background: '#F7F7F7', overflow: 'hidden', userSelect: 'none' }}
          onTouchStart={handleTouchStart}
          onTouchEnd={(e) => handleTouchEnd(e, images.length)}
        >
          {/* Фото — соотношение 3:4 как у goldapple */}
          <img
            src={images[photoIndex]}
            alt={product.name}
            style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', display: 'block' }}
          />

          {/* Зоны нажатия */}
          {images.length > 1 && (
            <>
              <div onClick={() => setPhotoIndex(i => (i - 1 + images.length) % images.length)}
                style={{ position: 'absolute', left: 0, top: 0, width: '35%', height: '100%', cursor: 'pointer' }} />
              <div onClick={() => setPhotoIndex(i => (i + 1) % images.length)}
                style={{ position: 'absolute', right: 0, top: 0, width: '35%', height: '100%', cursor: 'pointer' }} />
            </>
          )}

          {/* Бейджи — левый верх */}
          <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 5 }}>
            {product.isNew && <span className="badge badge--new">NEW</span>}
            {product.isHot && <span className="badge badge--hot">HOT</span>}
            {isLastUnits && <span className="badge badge--last">LAST</span>}
          </div>

          {/* Кнопка избранное — правый верх */}
          <button
            onClick={() => { setIsFav(f => !f); haptic?.selectionChanged(); }}
            style={{
              position: 'absolute', top: 12, right: 12,
              width: 40, height: 40, borderRadius: '50%',
              background: 'rgba(255,255,255,0.92)',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              color: isFav ? '#E53935' : '#999', transition: 'color 0.15s',
            }}
          >
            {isFav ? '♥' : '♡'}
          </button>

          {/* Точки-индикатор — по центру снизу */}
          {images.length > 1 && (
            <div style={{
              position: 'absolute', bottom: 14, left: 0, right: 0,
              display: 'flex', justifyContent: 'center', gap: 5,
            }}>
              {images.map((_, i) => (
                <div
                  key={i}
                  onClick={() => setPhotoIndex(i)}
                  style={{
                    width: i === photoIndex ? 22 : 6,
                    height: 6, borderRadius: 3,
                    background: i === photoIndex ? '#fff' : 'rgba(255,255,255,0.45)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                    transition: 'width 0.22s ease',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* ══ ШАПКА ТОВАРА ════════════════════════════════════════════════ */}
        <div style={{ padding: '16px 16px 14px', borderBottom: '1px solid #F0F0F0' }}>

          {/* Рейтинг */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Stars rating={reviewData.rating} />
            <span style={{ fontSize: 12, color: '#888', fontFamily: IB }}>
              {reviewData.rating.toFixed(1)} · {reviewData.count} отзывов
            </span>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#888', fontFamily: IB }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4CAF50', display: 'inline-block' }} />
              {fomoCount} смотрят
            </div>
          </div>

          {/* Бренд + категория */}
          <div style={{ fontSize: 10, fontWeight: 700, color: '#C9963D', letterSpacing: '1.5px', textTransform: 'uppercase', fontFamily: IB, marginBottom: 4 }}>
            {product.brand} · {genderLabel}
          </div>

          {/* Название */}
          <div style={{ fontFamily: BB, fontSize: 30, letterSpacing: '0.02em', color: '#0A0A0A', lineHeight: 1.05, marginBottom: 6 }}>
            {product.name}
          </div>

          {product.colorway && (
            <div style={{ fontSize: 12, color: '#999', fontFamily: IB, marginBottom: 8 }}>{product.colorway}</div>
          )}

          {/* Цена */}
          <div style={{ fontFamily: BB, fontSize: 36, color: '#0A0A0A', lineHeight: 1, letterSpacing: '0.01em' }}>
            {product.price.toLocaleString('ru')} ₽
          </div>
        </div>

        {/* ══ РАЗМЕРЫ ══════════════════════════════════════════════════════ */}
        <div style={{ padding: '16px 16px', borderBottom: '1px solid #F0F0F0' }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700, fontFamily: IB, color: '#0A0A0A', letterSpacing: '0.3px' }}>
              {selectedSize ? `Размер: EU ${selectedSize}` : 'Выберите размер'}
            </span>
            {/* Переключатель системы */}
            <div style={{ display: 'flex', background: '#F0F0F0', borderRadius: 20, padding: 2 }}>
              {(['EU', 'US', 'UK'] as SizeSystem[]).map(sys => (
                <button key={sys} onClick={() => setSizeSystem(sys)} style={{
                  padding: '4px 11px', border: 'none', cursor: 'pointer', borderRadius: 18,
                  background: sizeSystem === sys ? '#0A0A0A' : 'transparent',
                  color: sizeSystem === sys ? '#fff' : '#888',
                  fontSize: 10, fontWeight: 700, fontFamily: IB, transition: 'all 0.15s',
                }}>{sys}</button>
              ))}
            </div>
          </div>

          {/* Кнопки размеров */}
          <div className="size-grid">
            {product.sizes.map((size) => {
              const stock = product.stockBySize?.[String(size)] ?? 0;
              const isOut = stock === 0;
              const isSelected = selectedSize === size;
              return (
                <button
                  key={String(size)}
                  className={`size-btn ${isSelected ? 'selected' : ''} ${isOut ? 'out-of-stock' : ''}`}
                  onClick={() => { if (isOut) return; setSelectedSize(size); haptic?.selectionChanged(); }}
                  disabled={isOut}
                  style={{ minWidth: 54, position: 'relative' }}
                >
                  {convertSize(size, sizeSystem, product.gender)}
                  {stock <= 2 && stock > 0 && (
                    <span style={{ position: 'absolute', top: 3, right: 3, width: 5, height: 5, borderRadius: '50%', background: '#E53935' }} />
                  )}
                </button>
              );
            })}
          </div>

          {selectedSize && (
            <div style={{ marginTop: 10, padding: '7px 12px', background: '#F9F5EE', borderLeft: '2px solid #C9963D', fontSize: 11, fontFamily: IB, color: '#555' }}>
              {euToAll(selectedSize, product.gender)}
            </div>
          )}

          {selectedStockLeft !== null && selectedStockLeft <= 2 && selectedStockLeft > 0 && (
            <div className="urgency-block" style={{ marginTop: 10 }}>
              ⚠️ Осталась {selectedStockLeft === 1 ? 'последняя пара' : `${selectedStockLeft} пары`} размера EU {selectedSize}
            </div>
          )}

          <button
            onClick={() => tg?.showAlert('Таблица размеров\n\nEU   US(M)  US(W)  UK\n35   3.5    5      3\n36   4      5.5    3.5\n37   5      6.5    4.5\n38   6      7.5    5.5\n39   7      8.5    6.5\n40   7.5    9      7\n41   8.5    10     8\n42   9      10.5   8.5\n43   10     11.5   9.5\n44   10.5   12     10\n45   11.5   13     11\n46   12.5   14     12')}
            style={{ marginTop: 10, background: 'none', border: 'none', fontSize: 12, color: '#888', cursor: 'pointer', fontFamily: IB, padding: 0, textDecoration: 'underline', textUnderlineOffset: 2 }}
          >
            Таблица размеров →
          </button>
        </div>

        {/* ══ КНОПКА В КОРЗИНУ (не в Telegram) ═══════════════════════════ */}
        {!isInTelegram && (
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #F0F0F0', display: 'flex', gap: 10 }}>
            <button
              onClick={handleAddToCart}
              disabled={!selectedSize}
              style={{
                flex: 1, padding: '15px 0', border: 'none',
                background: !selectedSize ? '#CCCCCC' : added ? '#2E7D32' : '#0A0A0A',
                color: '#fff', fontSize: 13, fontWeight: 700,
                letterSpacing: '1.5px', textTransform: 'uppercase',
                cursor: selectedSize ? 'pointer' : 'not-allowed',
                fontFamily: IB, transition: 'background 0.2s',
                borderRadius: 2,
              }}
            >
              {added ? '✅ ДОБАВЛЕНО' : selectedSize ? `В КОРЗИНУ — ${product.price.toLocaleString('ru')} ₽` : 'ВЫБЕРИТЕ РАЗМЕР'}
            </button>
            <button
              onClick={() => { setIsFav(f => !f); haptic?.selectionChanged(); }}
              style={{
                width: 52, background: '#F5F5F5', border: '1.5px solid #E8E8E8',
                borderRadius: 2, fontSize: 22, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: isFav ? '#E53935' : '#999', transition: 'color 0.15s',
              }}
            >
              {isFav ? '♥' : '♡'}
            </button>
          </div>
        )}

        {/* ══ ГАРАНТИИ ═════════════════════════════════════════════════════ */}
        <div style={{ padding: '16px 16px', borderBottom: '1px solid #F0F0F0' }}>
          {[
            {
              svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
              title: 'Люксовая копия',
              sub: 'Только оригинальные материалы',
            },
            {
              svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}><rect x="1" y="3" width="22" height="13" rx="2" /><path d="M16 21H8M12 17v4" /></svg>,
              title: 'Бесплатная доставка',
              sub: 'При заказе от 10 000 ₽',
            },
            {
              svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.51" /></svg>,
              title: 'Возврат 14 дней',
              sub: 'Без объяснения причин',
            },
          ].map(({ svg, title, sub }) => (
            <div key={title} style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                border: '1.5px solid #E8E8E8',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, color: '#0A0A0A',
              }}>{svg}</div>
              <div>
                <div style={{ fontFamily: IB, fontSize: 13, fontWeight: 700, color: '#0A0A0A', marginBottom: 1 }}>{title}</div>
                <div style={{ fontFamily: IB, fontSize: 12, color: '#999' }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ══ ОПИСАНИЕ ═════════════════════════════════════════════════════ */}
        {product.description && (
          <div style={{ padding: '16px', borderBottom: '1px solid #F0F0F0' }}>
            <div style={{ fontFamily: BB, fontSize: 20, letterSpacing: '0.04em', color: '#0A0A0A', marginBottom: 10 }}>О ТОВАРЕ</div>
            <div style={{ fontSize: 14, color: '#555', lineHeight: 1.8, fontFamily: IB }}>{product.description}</div>
          </div>
        )}

        {/* ══ ДЕТАЛИ ═══════════════════════════════════════════════════════ */}
        <div style={{ borderBottom: '1px solid #F0F0F0' }}>
          <DetailRow label="Бренд" value={product.brand} />
          <DetailRow label="Артикул" value={article} />
          {product.colorway && <DetailRow label="Расцветка" value={product.colorway} />}
          {product.material && <DetailRow label="Материал" value={product.material} />}
          <DetailRow label="Категория" value={product.category === 'sneakers' ? 'Кроссовки' : product.category === 'clothing' ? 'Одежда' : 'Сумки'} />
        </div>

        {/* ══ ПОХОЖИЕ ══════════════════════════════════════════════════════ */}
        {related.length > 0 && (
          <div style={{ paddingTop: 20 }}>
            <div style={{ fontFamily: BB, fontSize: 20, letterSpacing: '0.04em', color: '#0A0A0A', padding: '0 16px 12px' }}>С ЭТИМ БЕРУТ</div>
            <div className="horizontal-scroll">
              {related.map((p) => (
                <div
                  key={p.id}
                  className="horizontal-card"
                  onClick={() => { navigate(`/product/${p.id}`); setPhotoIndex(0); setSelectedSize(null); }}
                >
                  <img src={p.images[0] || 'https://placehold.co/140x140/F5F5F5/888?text=Фото'} alt={p.name} className="horizontal-card__img" loading="lazy" />
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

        <div style={{ height: 24 }} />
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #F7F7F7' }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#AAA', letterSpacing: '1px', textTransform: 'uppercase', fontFamily: IB }}>{label}</span>
      <span style={{ fontSize: 13, color: '#0A0A0A', fontFamily: IB, fontWeight: 500 }}>{value}</span>
    </div>
  );
}
