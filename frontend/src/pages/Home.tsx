import { useNavigate } from 'react-router-dom';
import { useTelegram } from '../hooks/useTelegram';

interface Brand { key: string; label: string; sub?: { key: string; label: string }[] }

const BRANDS: Brand[] = [
  { key: 'Nike',         label: 'NIKE' },
  { key: 'Jordan',       label: 'JORDAN' },
  { key: 'New Balance',  label: 'NEW BALANCE' },
  { key: 'Adidas',       label: 'ADIDAS' },
  { key: 'On Cloud',     label: 'ON CLOUD' },
  { key: 'Golden Goose', label: 'GOLDEN GOOSE' },
  { key: 'Premiata',     label: 'PREMIATA' },
  { key: 'Lacoste',      label: 'LACOSTE' },
];

export default function Home() {
  const navigate = useNavigate();
  const { user } = useTelegram();

  return (
    <div className="page-scroll">

      {/* ── Hero ── */}
      <div style={{ padding: '24px 16px 20px', borderBottom: '1px solid #E0E0E0' }}>
        <div
          className="home-hero-sub"
          style={{ fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#888888', marginBottom: 6 }}
        >
          {user ? `Привет, ${user.first_name}` : 'Добро пожаловать'}
        </div>
        <div
          className="home-hero-title"
          style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 42, lineHeight: 0.95, letterSpacing: '0.02em', color: '#0A0A0A', marginBottom: 8 }}
        >
          Urban Shop<br />Moscow
        </div>
        <div
          className="home-hero-sub"
          style={{ fontSize: 12, color: '#888888', letterSpacing: '0.5px', animationDelay: '0.25s' }}
        >
          Место где выбирают стиль
        </div>
      </div>

      {/* ── Поиск ── */}
      <div className="home-search" style={{ padding: '12px 16px', borderBottom: '1px solid #E0E0E0' }}>
        <button
          onClick={() => navigate('/catalog?focus=search')}
          style={{
            width: '100%', padding: '12px 14px', border: '1.5px solid #E0E0E0',
            background: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 8,
            color: '#888888', fontSize: 13, cursor: 'pointer', textAlign: 'left',
            fontFamily: "'Inter', sans-serif", borderRadius: 0,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          Поиск по каталогу...
        </button>
      </div>

      {/* ── Мужское ── */}
      <div className="home-section" style={{ borderBottom: '1px solid #E0E0E0', animationDelay: '0.15s' }}>
        <GenderHeader label="Мужское" sub="Men's Collection" dark onAll={() => navigate('/catalog?gender=male')} />
        <BrandGrid gender="male" navigate={navigate} baseDelay={0.2} />
      </div>

      {/* ── Женское ── */}
      <div className="home-section" style={{ borderBottom: '1px solid #E0E0E0', animationDelay: '0.25s' }}>
        <GenderHeader label="Женское" sub="Women's Collection" dark={false} onAll={() => navigate('/catalog?gender=female')} />
        <BrandGrid gender="female" navigate={navigate} baseDelay={0.3} />
      </div>

      {/* ── Промо ── */}
      <div style={{ padding: '20px 16px 24px' }}>
        <div className="home-promo" style={{ background: '#0A0A0A', padding: '20px', color: '#FFFFFF' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#C9963D', marginBottom: 8 }}>
            Специальное предложение
          </div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, lineHeight: 1, letterSpacing: '0.02em', marginBottom: 8 }}>
            Первый заказ<br />−5%
          </div>
          <div style={{ fontSize: 12, color: '#AAAAAA', marginBottom: 16 }}>
            Промокод <span style={{ color: '#C9963D', fontWeight: 700 }}>FIRST5</span> при оформлении
          </div>
          <button
            onClick={() => navigate('/catalog')}
            style={{
              background: '#FFFFFF', border: 'none', color: '#0A0A0A',
              padding: '10px 20px', fontSize: 10, fontWeight: 700,
              letterSpacing: '2px', textTransform: 'uppercase', cursor: 'pointer',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Смотреть каталог
          </button>
        </div>
      </div>

    </div>
  );
}

/* ── Заголовок раздела ── */
function GenderHeader({ label, sub, dark, onAll }: { label: string; sub: string; dark: boolean; onAll: () => void }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '16px 16px 12px',
      background: dark ? '#0A0A0A' : '#FFFFFF',
    }}>
      <div>
        <div style={{
          fontFamily: "'Bebas Neue', sans-serif", fontSize: 26,
          letterSpacing: '0.04em', lineHeight: 1,
          color: dark ? '#FFFFFF' : '#0A0A0A',
        }}>
          {label}
        </div>
        <div style={{
          fontFamily: "'Inter', sans-serif", fontSize: 10, fontWeight: 500,
          color: '#888888', letterSpacing: '0.5px', marginTop: 2,
        }}>
          {sub}
        </div>
      </div>
      <button
        onClick={onAll}
        style={{
          background: 'none',
          border: dark ? '1px solid #444' : '1px solid #E0E0E0',
          color: dark ? '#AAAAAA' : '#888888', padding: '6px 12px',
          fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase',
          cursor: 'pointer', fontFamily: "'Inter', sans-serif",
        }}
      >
        Все →
      </button>
    </div>
  );
}

/* ── Сетка брендов со stagger ── */
function BrandGrid({ gender, navigate, baseDelay }: {
  gender: string;
  navigate: (path: string) => void;
  baseDelay: number;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1px', background: '#E0E0E0' }}>
      {BRANDS.map((b, idx) => (
        <div
          key={b.key}
          className="home-brand-tile"
          style={{
            background: '#FFFFFF',
            display: 'flex', flexDirection: 'column',
            animationDelay: `${baseDelay + idx * 0.05}s`,
          }}
        >
          <button
            onClick={() => navigate(`/catalog?gender=${gender}&brand=${encodeURIComponent(b.key)}`)}
            style={{
              background: 'transparent', border: 'none', padding: '16px 16px 8px',
              textAlign: 'left', cursor: 'pointer',
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 17, letterSpacing: '0.05em', color: '#0A0A0A', lineHeight: 1,
            }}
          >
            {b.label}
            <div style={{
              fontFamily: "'Inter', sans-serif", fontSize: 9, fontWeight: 600,
              color: '#C9963D', letterSpacing: '1px', textTransform: 'uppercase', marginTop: 4,
            }}>
              Смотреть →
            </div>
          </button>

          {b.sub && b.sub.map((s) => (
            <button
              key={s.key}
              onClick={() => navigate(`/catalog?gender=${gender}&brand=${encodeURIComponent(s.key)}`)}
              style={{
                background: '#F5F5F5', border: 'none', borderTop: '1px solid #E0E0E0',
                padding: '8px 16px', textAlign: 'left', cursor: 'pointer',
                fontFamily: "'Inter', sans-serif", fontSize: 10, fontWeight: 700,
                color: '#444444', letterSpacing: '1.2px', textTransform: 'uppercase',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}
            >
              {s.label}
              <span style={{ color: '#C9963D', fontSize: 9 }}>→</span>
            </button>
          ))}

          {!b.sub && <div style={{ height: 16 }} />}
        </div>
      ))}
    </div>
  );
}
