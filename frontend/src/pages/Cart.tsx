import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cart';
import { useTelegram } from '../hooks/useTelegram';

const RESERVE_MINUTES = 15;

export default function Cart() {
  const navigate = useNavigate();
  const { tg, haptic } = useTelegram();
  const { items, removeItem, updateQuantity, total, count } = useCartStore();

  // Таймер резервирования
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (items.length === 0) return;
    const start = Date.now();
    const endTime = start + RESERVE_MINUTES * 60 * 1000;

    const tick = () => {
      const diff = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      setSecondsLeft(diff);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [items.length > 0]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  // MainButton
  useEffect(() => {
    if (!tg) return;
    if (items.length > 0) {
      tg.MainButton.setText(`Оформить заказ — ${total().toLocaleString('ru')} ₽`);
      tg.MainButton.show();
      tg.MainButton.enable();
      const go = () => navigate('/checkout');
      tg.MainButton.onClick(go);
      return () => tg.MainButton.offClick(go);
    } else {
      tg.MainButton.hide();
    }
  }, [tg, items.length, total()]);

  useEffect(() => {
    tg?.BackButton.show();
    tg?.BackButton.onClick(() => navigate(-1));
    return () => { tg?.BackButton.hide(); tg?.MainButton.hide(); };
  }, [tg, navigate]);

  if (items.length === 0) {
    return (
      <div className="page-scroll" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🛒</div>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: 'var(--tgui--text_color)' }}>Корзина пуста</div>
        <div style={{ fontSize: 14, color: 'var(--tgui--hint_color)', marginBottom: 24 }}>Добавьте товары из каталога</div>
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
    <div className="page-scroll" style={{ paddingBottom: 100 }}>
      {/* Заголовок */}
      <div style={{ padding: '16px 16px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--tgui--text_color)' }}>Корзина</div>
          <div style={{ fontSize: 13, color: 'var(--tgui--hint_color)' }}>{count()} {count() === 1 ? 'товар' : count() <= 4 ? 'товара' : 'товаров'}</div>
        </div>
        <div style={{ fontSize: 13, color: 'var(--tgui--hint_color)' }}>✅ Отличный выбор!</div>
      </div>

      {/* Таймер */}
      {secondsLeft !== null && secondsLeft > 0 && (
        <div className="cart-timer">
          <span>⏱</span>
          <span>Резервируем для вас ещё {formatTime(secondsLeft)}</span>
        </div>
      )}

      {/* Список товаров */}
      <div style={{ background: 'var(--tgui--bg_color)', borderRadius: 16, margin: '0 12px', overflow: 'hidden' }}>
        {items.map((item, idx) => (
          <div key={`${item.product.id}-${item.size}`} className="cart-item" style={{ borderBottom: idx < items.length - 1 ? undefined : 'none' }}>
            <img
              src={item.product.images[0] || 'https://placehold.co/70x70/f4f4f5/999?text=Фото'}
              alt={item.product.name}
              className="cart-item__img"
            />
            <div className="cart-item__info">
              <div style={{ fontSize: 11, color: 'var(--tgui--hint_color)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {item.product.brand}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tgui--text_color)', marginBottom: 2, lineHeight: 1.3 }}>
                {item.product.name}
              </div>
              <div style={{ fontSize: 13, color: 'var(--tgui--hint_color)', marginBottom: 4 }}>
                Размер: {item.size}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="quantity-control">
                  <button className="qty-btn" onClick={() => { updateQuantity(item.product.id, item.size, item.quantity - 1); haptic?.selectionChanged(); }}>−</button>
                  <span style={{ fontSize: 15, fontWeight: 600, minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
                  <button className="qty-btn" onClick={() => { updateQuantity(item.product.id, item.size, item.quantity + 1); haptic?.selectionChanged(); }}>+</button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>
                    {(item.product.price * item.quantity).toLocaleString('ru')} ₽
                  </div>
                  <button
                    onClick={() => { removeItem(item.product.id, item.size); haptic?.impactOccurred('light'); }}
                    style={{ background: 'none', border: 'none', fontSize: 16, color: 'var(--tgui--hint_color)', cursor: 'pointer', padding: 4 }}
                  >
                    🗑
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Итого */}
      <div style={{ margin: '16px 12px 0', padding: '16px', background: 'var(--tgui--secondary_bg_color)', borderRadius: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 14, color: 'var(--tgui--hint_color)' }}>Товары ({count()} шт.)</span>
          <span style={{ fontSize: 14 }}>{total().toLocaleString('ru')} ₽</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 14, color: 'var(--tgui--hint_color)' }}>Доставка</span>
          <span style={{ fontSize: 14, color: '#34c759' }}>Бесплатно</span>
        </div>
        <div style={{ borderTop: '1px solid var(--tgui--divider)', paddingTop: 12, marginTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 16, fontWeight: 700 }}>Итого</span>
          <span style={{ fontSize: 20, fontWeight: 800 }}>{total().toLocaleString('ru')} ₽</span>
        </div>
      </div>

      {/* Кнопка для браузера */}
      {!tg && (
        <div style={{ padding: '16px 12px 0' }}>
          <button
            onClick={() => navigate('/checkout')}
            style={{
              width: '100%', padding: 14, borderRadius: 12, border: 'none',
              background: 'var(--tgui--button_color, #2481cc)',
              color: 'white', fontSize: 16, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Оформить заказ — {total().toLocaleString('ru')} ₽
          </button>
        </div>
      )}
    </div>
  );
}
