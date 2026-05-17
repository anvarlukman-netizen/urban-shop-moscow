import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { useTelegram } from '../hooks/useTelegram';
import type { Order } from '../types';

const STATUS_LABEL: Record<string, string> = {
  new: 'Новый',
  confirmed: 'Подтверждён',
  shipped: 'В пути',
  delivered: 'Доставлен',
  cancelled: 'Отменён',
};

const STATUS_CLASS: Record<string, string> = {
  new: 'status-new',
  confirmed: 'status-confirmed',
  shipped: 'status-shipped',
  delivered: 'status-delivered',
  cancelled: 'status-cancelled',
};

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useTelegram();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: api.getMyOrders,
  });

  return (
    <div className="page-scroll">
      {/* Аватар и имя */}
      <div style={{ padding: '20px 16px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 58, height: 58, borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, color: 'white', fontWeight: 700, flexShrink: 0,
        }}>
          {user?.first_name?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--tgui--text_color)' }}>
            {user ? `${user.first_name}${user.last_name ? ' ' + user.last_name : ''}` : 'Пользователь'}
          </div>
          {user?.username && (
            <div style={{ fontSize: 14, color: 'var(--tgui--hint_color)' }}>@{user.username}</div>
          )}
        </div>
      </div>

      {/* Промокод баннер */}
      <div style={{ margin: '0 16px 20px' }}>
        <div style={{
          padding: '12px 14px', borderRadius: 12,
          background: 'linear-gradient(135deg, #34c759 0%, #30d158 100%)',
          color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: 11, opacity: 0.85, marginBottom: 2 }}>Промокод для друзей</div>
            <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: 1 }}>FIRST5</div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>-5%</div>
        </div>
      </div>

      {/* История заказов */}
      <div style={{ padding: '0 16px 10px', fontSize: 17, fontWeight: 700, color: 'var(--tgui--text_color)' }}>
        История заказов
      </div>

      {isLoading ? (
        <div style={{ padding: '0 16px' }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div className="skeleton" style={{ height: 80, borderRadius: 12 }} />
            </div>
          ))}
        </div>
      ) : !orders || orders.length === 0 ? (
        <div style={{ padding: '20px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📦</div>
          <div style={{ fontSize: 15, color: 'var(--tgui--hint_color)', marginBottom: 16 }}>
            Заказов пока нет
          </div>
          <button
            onClick={() => navigate('/catalog')}
            style={{
              padding: '10px 24px', borderRadius: 10, border: 'none',
              background: 'var(--tgui--button_color, #2481cc)',
              color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Перейти в каталог
          </button>
        </div>
      ) : (
        <div style={{ padding: '0 16px' }}>
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}

      {/* Ссылка на канал */}
      <div style={{ margin: '20px 16px 24px', padding: '14px', background: 'var(--tgui--secondary_bg_color)', borderRadius: 14, textAlign: 'center' }}>
        <div style={{ fontSize: 13, color: 'var(--tgui--hint_color)', marginBottom: 6 }}>
          Следи за новинками в нашем канале
        </div>
        <a
          href="https://t.me/urbanshopmoscow"
          style={{ color: 'var(--tgui--button_color, #2481cc)', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}
        >
          @urbanshopmoscow →
        </a>
      </div>
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  const date = new Date(order.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  const itemsCount = order.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div style={{
      background: 'var(--tgui--secondary_bg_color, #f4f4f5)',
      borderRadius: 14, padding: '14px', marginBottom: 10,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--tgui--text_color)' }}>
            Заказ #{order.id}
          </div>
          <div style={{ fontSize: 12, color: 'var(--tgui--hint_color)', marginTop: 2 }}>
            {date} · {itemsCount} {itemsCount === 1 ? 'товар' : 'товара'}
          </div>
        </div>
        <span className={`order-status ${STATUS_CLASS[order.status] ?? 'status-new'}`}>
          {STATUS_LABEL[order.status] ?? order.status}
        </span>
      </div>
      <div style={{ fontSize: 13, color: 'var(--tgui--hint_color)', marginBottom: 8 }}>
        {order.items.slice(0, 2).map((i) => `${i.brand} ${i.productName} (р.${i.size})`).join(', ')}
        {order.items.length > 2 && ` и ещё ${order.items.length - 2}`}
      </div>
      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--tgui--text_color)' }}>
        {order.totalAmount.toLocaleString('ru')} ₽
      </div>
    </div>
  );
}
