import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { api } from '../api/client';
import { useCartStore } from '../store/cart';
import { useTelegram } from '../hooks/useTelegram';
import PageHeader from '../components/PageHeader';

export default function Checkout() {
  const navigate = useNavigate();
  const { tg, user, haptic } = useTelegram();
  const { items, total, clear } = useCartStore();

  // true только когда реально внутри Telegram (initData непустой)
  const isInTelegram = Boolean(tg?.initData);

  const [name, setName] = useState(user ? `${user.first_name}${user.last_name ? ' ' + user.last_name : ''}` : '');
  const [phone, setPhone] = useState('');
  const [delivery, setDelivery] = useState<'pickup' | 'delivery'>('pickup');
  const [address, setAddress] = useState('');
  const [payment, setPayment] = useState<'card' | 'cash'>('card');
  const [comment, setComment] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: api.createOrder,
    onSuccess: (data) => {
      haptic?.notificationOccurred('success');
      clear();
      navigate(`/?order=${data.orderId}`, { replace: true });
      tg?.showAlert(`🎉 Заказ #${data.orderId} принят!\n\nМенеджер свяжется с вами в ближайшее время.`);
    },
    onError: (err: Error) => {
      haptic?.notificationOccurred('error');
      tg?.showAlert(`Ошибка: ${err.message}`);
    },
  });

  useEffect(() => {
    if (!isInTelegram) return;
    tg?.BackButton.show();
    tg?.BackButton.onClick(() => navigate(-1));
    return () => { tg?.BackButton.hide(); tg?.MainButton.hide(); };
  }, [tg, isInTelegram, navigate]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (name.trim().length < 2) e.name = 'Введите имя';
    if (phone.length < 11) e.phone = 'Введите 11 цифр';
    if (delivery === 'delivery' && address.trim().length < 5) e.address = 'Введите адрес доставки';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) { haptic?.notificationOccurred('error'); return; }
    mutation.mutate({
      customerName: name.trim(),
      phone: phone.trim(),
      deliveryType: delivery,
      address: address.trim(),
      paymentMethod: payment,
      comment: comment.trim(),
      items: items.map((i) => ({
        productId: i.product.id,
        productName: i.product.name,
        brand: i.product.brand,
        size: i.size,
        quantity: i.quantity,
        price: i.product.price,
        image: i.product.images[0] || '',
      })),
      totalAmount: total(),
    });
  };

  // ref всегда держит актуальный handleSubmit — решает stale closure
  const submitRef = useRef(handleSubmit);
  submitRef.current = handleSubmit;

  // MainButton (только внутри Telegram)
  useEffect(() => {
    if (!isInTelegram || !tg) return;
    const handler = () => submitRef.current();
    tg.MainButton.setText(mutation.isPending ? 'Оформляем...' : `Подтвердить заказ — ${total().toLocaleString('ru')} ₽`);
    tg.MainButton.show();
    if (mutation.isPending) {
      tg.MainButton.disable();
    } else {
      tg.MainButton.enable();
      tg.MainButton.onClick(handler);
    }
    return () => tg.MainButton.offClick(handler);
  }, [tg, isInTelegram, mutation.isPending, total()]);

  const inputStyle = (field: string) => ({
    ...(errors[field] ? { borderColor: '#ff3b30' } : {}),
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {!isInTelegram && <PageHeader title="Оформление заказа" />}
    <div className="page-scroll" style={{ paddingBottom: 100 }}>
      {isInTelegram && (
        <div style={{ padding: '16px 16px 20px', fontSize: 20, fontWeight: 700, color: 'var(--tgui--text_color)' }}>
          Оформление заказа
        </div>
      )}

      {/* Имя */}
      <div className="form-section">
        <div className="form-label">Имя *</div>
        <input
          className="form-input"
          style={inputStyle('name')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ваше имя"
        />
        {errors.name && <div style={{ color: '#ff3b30', fontSize: 12, marginTop: 4 }}>{errors.name}</div>}
      </div>

      {/* Телефон */}
      <div className="form-section">
        <div className="form-label">Телефон *</div>
        <input
          className="form-input"
          style={inputStyle('phone')}
          value={phone}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
            setPhone(digits);
            if (digits.length >= 11) setErrors((prev) => ({ ...prev, phone: '' }));
          }}
          placeholder="89991234567"
          type="tel"
          inputMode="numeric"
          maxLength={11}
        />
        {errors.phone && <div style={{ color: '#ff3b30', fontSize: 12, marginTop: 4 }}>{errors.phone}</div>}
      </div>

      {/* Доставка */}
      <div className="form-section">
        <div className="form-label">Способ получения</div>
        <div className="radio-group">
          <button className={`radio-option ${delivery === 'pickup' ? 'selected' : ''}`} onClick={() => setDelivery('pickup')}>
            🏪 Самовывоз
          </button>
          <button className={`radio-option ${delivery === 'delivery' ? 'selected' : ''}`} onClick={() => setDelivery('delivery')}>
            🚚 Доставка
          </button>
        </div>
      </div>

      {/* Адрес */}
      {delivery === 'delivery' && (
        <div className="form-section">
          <div className="form-label">Адрес доставки *</div>
          <input
            className="form-input"
            style={inputStyle('address')}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Улица, дом, квартира"
          />
          {errors.address && <div style={{ color: '#ff3b30', fontSize: 12, marginTop: 4 }}>{errors.address}</div>}
        </div>
      )}

      {/* Оплата */}
      <div className="form-section">
        <div className="form-label">Способ оплаты</div>
        <div className="radio-group">
          <button className={`radio-option ${payment === 'card' ? 'selected' : ''}`} onClick={() => setPayment('card')}>
            💳 Перевод на карту
          </button>
          <button className={`radio-option ${payment === 'cash' ? 'selected' : ''}`} onClick={() => setPayment('cash')}>
            💵 Наличные
          </button>
        </div>
        {payment === 'card' && (
          <div style={{ marginTop: 8, padding: '10px 12px', background: 'rgba(36,129,204,0.08)', borderRadius: 8, fontSize: 13, color: 'var(--tgui--hint_color)' }}>
            После подтверждения заказа менеджер пришлёт реквизиты для оплаты
          </div>
        )}
      </div>

      {/* Комментарий */}
      <div className="form-section">
        <div className="form-label">Комментарий (необязательно)</div>
        <textarea
          className="form-input"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Пожелания к заказу..."
          rows={3}
          style={{ resize: 'none', fontFamily: 'inherit' }}
        />
      </div>

      {/* Итого */}
      <div style={{ margin: '0 16px 20px', padding: 16, background: 'var(--tgui--secondary_bg_color)', borderRadius: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10, color: 'var(--tgui--text_color)' }}>Ваш заказ</div>
        {items.map((i) => (
          <div key={`${i.product.id}-${i.size}`} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 14 }}>
            <span style={{ color: 'var(--tgui--hint_color)', flex: 1 }}>
              {i.product.brand} {i.product.name}, р.{i.size} × {i.quantity}
            </span>
            <span style={{ fontWeight: 600, marginLeft: 8 }}>{(i.product.price * i.quantity).toLocaleString('ru')} ₽</span>
          </div>
        ))}
        <div style={{ borderTop: '1px solid var(--tgui--divider)', paddingTop: 10, marginTop: 6, display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 800 }}>
          <span>Итого</span>
          <span>{total().toLocaleString('ru')} ₽</span>
        </div>
      </div>

      {/* Безопасность */}
      <div style={{ margin: '0 16px 24px', fontSize: 12, color: 'var(--tgui--hint_color)', textAlign: 'center' }}>
        🔒 Ваши данные защищены и используются только для оформления заказа
      </div>

      {/* Кнопка — показывается когда НЕ внутри Telegram */}
      {!isInTelegram && (
        <div style={{ padding: '0 16px 24px' }}>
          <button
            onClick={handleSubmit}
            disabled={mutation.isPending}
            style={{
              width: '100%', padding: 14, borderRadius: 12, border: 'none',
              background: mutation.isPending ? '#ccc' : 'var(--tgui--button_color, #2481cc)',
              color: 'white', fontSize: 16, fontWeight: 700, cursor: mutation.isPending ? 'not-allowed' : 'pointer',
            }}
          >
            {mutation.isPending ? 'Оформляем...' : `Подтвердить заказ — ${total().toLocaleString('ru')} ₽`}
          </button>
        </div>
      )}
    </div>
    </div>
  );
}
