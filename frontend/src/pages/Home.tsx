import { useNavigate } from 'react-router-dom';
import { useTelegram } from '../hooks/useTelegram';

const IB = "'Inter', sans-serif";
const BB = "'Bebas Neue', sans-serif";

const BRANDS = [
  { key: 'Nike',         label: 'NIKE' },
  { key: 'Jordan',       label: 'JORDAN' },
  { key: 'New Balance',  label: 'NEW BALANCE' },
  { key: 'Adidas',       label: 'ADIDAS' },
  { key: 'On Cloud',     label: 'ON RUNNING' },
  { key: 'Golden Goose', label: 'GOLDEN GOOSE' },
  { key: 'Premiata',     label: 'PREMIATA' },
  { key: 'Lacoste',      label: 'LACOSTE' },
];

const CATEGORIES = [
  { label: 'Новинки сезона',     icon: '✦', params: '?isNew=true' },
  { label: 'Мужская коллекция',  icon: '◈', params: '?gender=male' },
  { label: 'Женская коллекция',  icon: '◈', params: '?gender=female' },
  { label: 'Хиты продаж',        icon: '★', params: '?isHot=true' },
];

export default function Home() {
  const navigate = useNavigate();
  const { user } = useTelegram();

  return (
    <div className="page-scroll">

      {/* ── Hero ── */}
      <div style={{ padding: '22px 16px 18px', borderBottom: '1.5px solid #0A0A0A' }}>
        <div className="home-hero-sub" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: '#888', marginBottom: 6, fontFamily: IB }}>
          {user ? `Привет, ${user.first_name}` : 'Moscow · Доставка по РФ'}
        </div>
        <div className="home-hero-title" style={{ fontFamily: BB, fontSize: 40, lineHeight: 0.95, letterSpacing: '0.02em', color: '#0A0A0A', marginBottom: 6 }}>
          Urban Shop<br />Moscow
        </div>
        <div className="home-hero-sub" style={{ fontSize: 11, color: '#888', letterSpacing: '0.5px', fontFamily: IB, animationDelay: '0.25s' }}>
          Люксовые копии · Быстрая доставка
        </div>
      </div>

      {/* ── Поиск ── */}
      <div className="home-search" style={{ padding: '10px 16px', borderBottom: '1px solid #EBEBEB' }}>
        <button
          onClick={() => navigate('/catalog?focus=search')}
          style={{
            width: '100%', padding: '11px 14px',
            border: '1.5px solid #E0E0E0', background: '#FAFAFA',
            display: 'flex', alignItems: 'center', gap: 10,
            color: '#AAA', fontSize: 13, cursor: 'pointer',
            fontFamily: IB, borderRadius: 0,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          Поиск по каталогу...
        </button>
      </div>

      {/* ── Категории (brandshop-стиль) ── */}
      <div className="home-section" style={{ borderBottom: '1px solid #EBEBEB' }}>
        <div style={{ padding: '14px 16px 6px', fontFamily: BB, fontSize: 13, letterSpacing: '2px', color: '#AAA' }}>
          РАЗДЕЛЫ
        </div>
        {CATEGORIES.map((cat, i) => (
          <button
            key={cat.label}
            onClick={() => navigate(`/catalog${cat.params}`)}
            className="home-brand-tile"
            style={{
              display: 'flex', alignItems: 'center', width: '100%',
              padding: '15px 16px', background: '#FFF', border: 'none',
              borderBottom: '1px solid #F5F5F5', cursor: 'pointer',
              animationDelay: `${0.05 + i * 0.06}s`,
            }}
          >
            <span style={{ fontFamily: IB, fontSize: 11, fontWeight: 700, color: '#C9963D', width: 18, textAlign: 'center', marginRight: 14 }}>
              {cat.icon}
            </span>
            <span style={{ fontFamily: IB, fontSize: 16, fontWeight: 500, color: '#0A0A0A', flex: 1, textAlign: 'left', letterSpacing: '0.2px' }}>
              {cat.label}
            </span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth={2}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        ))}
      </div>

      {/* ── Бренды ── */}
      <div className="home-section" style={{ animationDelay: '0.2s' }}>
        <div style={{ padding: '16px 16px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: BB, fontSize: 13, letterSpacing: '2px', color: '#AAA' }}>БРЕНДЫ</div>
          <button
            onClick={() => navigate('/catalog')}
            style={{ background: 'none', border: 'none', fontFamily: IB, fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '1px', cursor: 'pointer', textTransform: 'uppercase' }}
          >
            Все →
          </button>
        </div>

        {/* Сетка брендов */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1px', background: '#EBEBEB', margin: '0 0 1px' }}>
          {BRANDS.map((b, i) => (
            <button
              key={b.key}
              className="home-brand-tile"
              onClick={() => navigate(`/catalog?brand=${encodeURIComponent(b.key)}`)}
              style={{
                background: '#FFFFFF',
                border: 'none', cursor: 'pointer',
                padding: '20px 16px 16px',
                display: 'flex', flexDirection: 'column',
                alignItems: 'flex-start', gap: 6,
                animationDelay: `${0.25 + i * 0.05}s`,
                minHeight: 80,
              }}
            >
              <span style={{ fontFamily: BB, fontSize: 20, letterSpacing: '0.05em', color: '#0A0A0A', lineHeight: 1 }}>
                {b.label}
              </span>
              <span style={{ fontFamily: IB, fontSize: 9, fontWeight: 700, color: '#C9963D', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                Смотреть →
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Промо ── */}
      <div style={{ padding: '20px 16px 24px' }}>
        <div className="home-promo" style={{ background: '#0A0A0A', padding: '22px 20px', color: '#FFF', position: 'relative', overflow: 'hidden' }}>
          {/* Декоративная линия */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #C9963D, transparent)' }} />
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '2.5px', textTransform: 'uppercase', color: '#C9963D', marginBottom: 10, fontFamily: IB }}>
            Специальное предложение
          </div>
          <div style={{ fontFamily: BB, fontSize: 38, lineHeight: 1, letterSpacing: '0.02em', marginBottom: 10 }}>
            Первый заказ<br />−5%
          </div>
          <div style={{ fontSize: 12, color: '#AAA', marginBottom: 18, fontFamily: IB }}>
            Промокод <span style={{ color: '#C9963D', fontWeight: 700, letterSpacing: '1px' }}>FIRST5</span> при оформлении
          </div>
          <button
            onClick={() => navigate('/catalog')}
            style={{
              background: '#FFF', border: 'none', color: '#0A0A0A',
              padding: '11px 22px', fontSize: 10, fontWeight: 700,
              letterSpacing: '2px', textTransform: 'uppercase',
              cursor: 'pointer', fontFamily: IB,
            }}
          >
            Смотреть каталог →
          </button>
        </div>
      </div>

    </div>
  );
}
