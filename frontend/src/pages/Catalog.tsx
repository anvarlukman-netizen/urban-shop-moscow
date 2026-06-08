import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import type { Category, Gender, Product } from '../types';
import PageHeader from '../components/PageHeader';

const IB = "'Inter', sans-serif";

export default function Catalog() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [category, setCategory] = useState<Category>((searchParams.get('category') as Category) || 'all');
  const [gender, setGender] = useState<Gender>((searchParams.get('gender') as Gender) || 'all');
  const [brand, setBrand] = useState<string>(searchParams.get('brand') || '');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchParams.get('focus') === 'search') searchRef.current?.focus();
    if (searchParams.get('gender')) setGender(searchParams.get('gender') as Gender);
    if (searchParams.get('brand')) setBrand(searchParams.get('brand') || '');
    if (searchParams.get('category')) setCategory(searchParams.get('category') as Category);
  }, [searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const queryParams: Record<string, string> = {};
  if (category !== 'all') queryParams.category = category;
  if (gender !== 'all') queryParams.gender = gender;
  if (brand) queryParams.brand = brand;
  if (search) queryParams.search = search;
  if (searchParams.get('isNew') === 'true') queryParams.isNew = 'true';
  if (searchParams.get('isHot') === 'true') queryParams.isHot = 'true';

  const { data: products, isLoading, isError, error } = useQuery({
    queryKey: ['products', queryParams],
    queryFn: () => api.getProducts({ ...queryParams, limit: '50' }),
  });

  const { data: brands } = useQuery({
    queryKey: ['brands'],
    queryFn: () => api.getBrands(),
  });

  const genders: { key: Gender; label: string }[] = [
    { key: 'all', label: 'Все' },
    { key: 'male', label: 'Мужское' },
    { key: 'female', label: 'Женское' },
  ];

  const hasFilters = gender !== 'all' || brand !== '';

  /* Заголовок раздела */
  const sectionTitle = () => {
    const g = gender === 'male' ? 'Мужские' : gender === 'female' ? 'Женские' : '';
    const b = brand || '';
    if (g && b) return `${g} · ${b}`;
    if (g) return `${g} кроссовки`;
    if (b) return b;
    if (searchParams.get('isNew') === 'true') return 'Новинки';
    if (searchParams.get('isHot') === 'true') return 'Хиты продаж';
    return 'Все кроссовки';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
    <PageHeader title="Каталог" onBack={() => navigate('/')} />
    <div className="page-scroll">

      {/* ── Поиск ── */}
      <div style={{ padding: '12px 16px', position: 'relative', borderBottom: '1px solid #F0F0F0' }}>
        <svg style={{ position: 'absolute', left: 28, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#BBB' }}
          width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          ref={searchRef}
          style={{
            width: '100%', padding: '10px 36px 10px 38px',
            fontSize: 14, fontFamily: IB, color: '#0A0A0A',
            border: '1.5px solid #E8E8E8', background: '#FAFAFA',
            borderRadius: 100, outline: 'none', boxSizing: 'border-box',
          }}
          placeholder="Поиск по названию или бренду..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          autoComplete="off"
        />
        {searchInput && (
          <button type="button" onClick={() => { setSearchInput(''); setSearch(''); }}
            style={{ position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', fontSize: 16, color: '#BBB', cursor: 'pointer', padding: 4 }}>
            ✕
          </button>
        )}
      </div>

      {/* ── Фильтры ── */}
      <div style={{ padding: '10px 0 2px', borderBottom: '1px solid #F0F0F0' }}>

        {/* Пол */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '0 16px 8px', scrollbarWidth: 'none' }}>
          {genders.map((g) => (
            <button key={g.key} onClick={() => setGender(g.key)} style={{
              flexShrink: 0, padding: '6px 16px',
              borderRadius: 100, border: '1.5px solid',
              borderColor: gender === g.key ? '#0A0A0A' : '#E0E0E0',
              background: gender === g.key ? '#0A0A0A' : '#FFF',
              color: gender === g.key ? '#FFF' : '#555',
              fontSize: 13, fontFamily: IB, fontWeight: gender === g.key ? 600 : 400,
              cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
            }}>
              {g.label}
            </button>
          ))}

          {/* Разделитель */}
          <div style={{ width: 1, background: '#E8E8E8', margin: '4px 2px', flexShrink: 0 }} />

          {/* Бренды inline с полом */}
          <button onClick={() => setBrand('')} style={{
            flexShrink: 0, padding: '6px 16px',
            borderRadius: 100, border: '1.5px solid',
            borderColor: brand === '' ? '#0A0A0A' : '#E0E0E0',
            background: brand === '' ? '#0A0A0A' : '#FFF',
            color: brand === '' ? '#FFF' : '#555',
            fontSize: 13, fontFamily: IB, fontWeight: brand === '' ? 600 : 400,
            cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
          }}>
            Все бренды
          </button>

          {(brands ?? []).map((b) => (
            <button key={b} onClick={() => setBrand(b === brand ? '' : b)} style={{
              flexShrink: 0, padding: '6px 16px',
              borderRadius: 100, border: '1.5px solid',
              borderColor: brand === b ? '#0A0A0A' : '#E0E0E0',
              background: brand === b ? '#0A0A0A' : '#FFF',
              color: brand === b ? '#FFF' : '#555',
              fontSize: 13, fontFamily: IB, fontWeight: brand === b ? 600 : 400,
              cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
            }}>
              {b}
            </button>
          ))}
        </div>

        {/* Сброс фильтров */}
        {hasFilters && (
          <button onClick={() => { setGender('all'); setBrand(''); setSearchParams({}); }}
            style={{ margin: '0 16px 8px', background: 'none', border: 'none', fontSize: 12, color: '#888', cursor: 'pointer', fontFamily: IB, textDecoration: 'underline', padding: 0 }}>
            Сбросить фильтры
          </button>
        )}
      </div>

      {/* ── Заголовок раздела (как brandshop) ── */}
      <div style={{ padding: '14px 16px 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ fontFamily: IB, fontSize: 17, fontWeight: 600, color: '#0A0A0A', letterSpacing: '-0.2px' }}>
          {sectionTitle()}
        </div>
        <div style={{ fontFamily: IB, fontSize: 12, color: '#AAA' }}>
          {isLoading ? '...' : isError ? '!' : `${products?.length ?? 0}`}
        </div>
      </div>

      {/* ── Сетка товаров ── */}
      {isLoading ? (
        <div className="catalog-grid" style={{ margin: '8px 0' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ background: '#FFF' }}>
              <div className="skeleton" style={{ width: '100%', aspectRatio: '1' }} />
              <div style={{ padding: '8px 10px 14px' }}>
                <div className="skeleton" style={{ height: 10, width: '40%', marginBottom: 6 }} />
                <div className="skeleton" style={{ height: 13, width: '75%', marginBottom: 6 }} />
                <div className="skeleton" style={{ height: 16, width: '50%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div style={{ textAlign: 'center', padding: '40px 16px', color: '#999' }}>
          <div style={{ fontSize: 13, fontFamily: IB }}>Ошибка загрузки · {(error as Error)?.message}</div>
        </div>
      ) : products?.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 16px', color: '#999' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#0A0A0A', marginBottom: 6, fontFamily: IB }}>Ничего не найдено</div>
          <div style={{ fontSize: 13, fontFamily: IB }}>Попробуйте другой запрос или бренд</div>
        </div>
      ) : (
        <div className="catalog-grid" style={{ margin: '8px 0' }}>
          {products?.map((p) => (
            <ProductCard key={p.id} product={p} onClick={() => navigate(`/product/${p.id}`)} />
          ))}
        </div>
      )}

      <div style={{ height: 20 }} />
    </div>
    </div>
  );
}

function ProductCard({ product, onClick }: { product: Product; onClick: () => void }) {
  const totalStock = Object.values(product.stockBySize || {}).reduce((a, b) => a + b, 0);
  const isLast = totalStock > 0 && totalStock <= 3;

  return (
    <div onClick={onClick} style={{ cursor: 'pointer', background: '#FFF' }}>
      {/* Фото — contain, весь товар виден */}
      <div style={{ position: 'relative', background: '#F7F7F7', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8 }}>
        <img
          src={product.images[0] || 'https://placehold.co/300x300/F7F7F7/CCC?text=Фото'}
          alt={product.name}
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
        />
        {/* Бейджи */}
        <div style={{ position: 'absolute', top: 6, left: 6, display: 'flex', gap: 3 }}>
          {product.isNew && <span className="badge badge--new">NEW</span>}
          {product.isHot && !product.isNew && <span className="badge badge--hot">HOT</span>}
          {isLast && <span className="badge badge--last">LAST</span>}
        </div>
      </div>
      {/* Инфо */}
      <div style={{ padding: '8px 10px 14px' }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: '#C9963D', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 3, fontFamily: IB }}>
          {product.brand}
        </div>
        <div style={{ fontSize: 12, color: '#0A0A0A', lineHeight: 1.4, marginBottom: 5, fontFamily: IB,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {product.name}
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#0A0A0A', fontFamily: IB }}>
          {product.price.toLocaleString('ru')} ₽
        </div>
      </div>
    </div>
  );
}
