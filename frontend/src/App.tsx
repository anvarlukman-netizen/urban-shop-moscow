import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useTelegram } from './hooks/useTelegram';
import { useCartStore } from './store/cart';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import Product from './pages/Product';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Favourites from './pages/Favourites';
import Profile from './pages/Profile';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { colorScheme } = useTelegram();
  const cartCount = useCartStore((s) => s.count());

  const tabs = [
    { path: '/', icon: <HomeIcon />, label: 'Главная' },
    { path: '/catalog', icon: <CatalogIcon />, label: 'Каталог' },
    { path: '/favourites', icon: <HeartIcon />, label: 'Избранное' },
    { path: '/cart', icon: <CartIcon count={cartCount} />, label: 'Корзина' },
    { path: '/profile', icon: <ProfileIcon />, label: 'Профиль' },
  ];

  const hideNav = location.pathname.startsWith('/product/') ||
    location.pathname === '/checkout' ||
    location.pathname === '/order-success';

  return (
    <div data-color-scheme={colorScheme} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/product/:id" element={<Product />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/favourites" element={<Favourites />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>

      {!hideNav && (
        <nav className="bottom-nav">
          {tabs.map((tab) => {
            const isActive = tab.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(tab.path);
            return (
              <button
                key={tab.path}
                className={`bottom-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => navigate(tab.path)}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}

// Иконки SVG
function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function CatalogIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function CartIcon({ count }: { count: number }) {
  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 22, height: 22 }}>
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
      {count > 0 && <span className="cart-badge">{count > 99 ? '99+' : count}</span>}
    </div>
  );
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
