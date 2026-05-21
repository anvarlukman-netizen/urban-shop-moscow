import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import type { Category, Gender, Product } from '../types';

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

  const queryParams: Record<string, string> = {};
  if (category !== 'all') queryParams.category = category;
  if (gender !== 'all') queryParams.gender = gender;
  if (brand) queryParams.brand = brand;
  if (search) queryParams.search = search;
  if (searchParams.get('isNew') === 'true') queryParams.isNew = 'true';
  if (searchParams.get('isHot') === 'true') queryParams.isHot = 'true';

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', queryParams],
    queryFn: () => api.getProducts({ ...queryParams, limit: '50' }),
  });

  const { data: brands } = useQuery({
    queryKey: ['brands'],
    queryFn: () => api.getBrands(),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const categories: { key: Category; label: string }[] = [
    { key: 'all', label: 'Все' },
    { key: 'sneakers', label: '👟 Кроссовки' },
    { key: 'clothing', label: '👕 Одежда' },
    { key: 'bags', label: '👜 Сумки' },
  ];

  const genders: { key: Gender; label: string }[] = [
    { key: 'all', label: 'Все' },
    { key: 'male', label: 'Мужское' },
    { key: 'female', label: 'Женское' },
  ];

  return (
    <div className="page-scroll">
      {/* Поиск */}
      <form onSubmit={handleSearch} style={{ padding: '12px 16px 8px', display: 'flex', gap: 8 }}>
        <input
          ref={searchRef}
          className="form-input"
          style={{ flex: 1, padding: '10px 14px', fontSize: 15 }}
          placeholder="Поиск по названию или бренду..."
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value);
            if (!e.target.value) setSearch('');
          }}
        />
        {searchInput && (
          <button
            type="button"
            onClick={() => { setSearchInput(''); setSearch(''); }}
            style={{ background: 'none', border: 'none', fontSize: 20, color: 'var(--tgui--hint_color)', cursor: 'pointer', padding: '0 4px' }}
          >
            ✕
          </button>
        )}
      </form>

      {/* Фильтр категорий */}
      <div className="filter-scroll" style={{ paddingTop: 4 }}>
        {categories.map((c) => (
          <button
            key={c.key}
            className={`filter-chip ${category === c.key ? 'active' : ''}`}
            onClick={() => {
              setCategory(c.key);
              setSearchParams({});
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Фильтр пол */}
      <div className="filter-scroll" style={{ paddingTop: 0, paddingBottom: 8 }}>
        {genders.map((g) => (
          <button
            key={g.key}
            className={`filter-chip ${gender === g.key ? 'active' : ''}`}
            onClick={() => setGender(g.key)}
          >
            {g.label}
          </button>
        ))}
      </div>

      {/* Фильтр брендов */}
      {brands && brands.length > 0 && (
        <div className="filter-scroll" style={{ paddingTop: 0, paddingBottom: 12 }}>
          <button
            className={`filter-chip ${brand === '' ? 'active' : ''}`}
            onClick={() => setBrand('')}
          >
            Все бренды
          </button>
          {brands.map((b) => (
            <button
              key={b}
              className={`filter-chip ${brand === b ? 'active' : ''}`}
              onClick={() => setBrand(b === brand ? '' : b)}
            >
              {b}
            </button>
          ))}
        </div>
      )}

      {/* Счётчик результатов */}
      <div style={{ padding: '0 16px 10px', fontSize: 13, color: 'var(--tgui--hint_color, #999)' }}>
        {isLoading ? 'Загружаем...' : `${products?.length ?? 0} товаров`}
      </div>

      {/* Сетка товаров */}
      {isLoading ? (
        <div className="catalog-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <div className="skeleton" style={{ width: '100%', aspectRatio: '1', borderRadius: 12 }} />
              <div className="skeleton" style={{ height: 12, marginTop: 8, width: '60%', borderRadius: 6 }} />
              <div className="skeleton" style={{ height: 16, marginTop: 6, width: '80%', borderRadius: 6 }} />
            </div>
          ))}
        </div>
      ) : products?.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--tgui--hint_color, #999)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Ничего не найдено</div>
          <div style={{ fontSize: 14 }}>Попробуй другие фильтры</div>
        </div>
      ) : (
        <div className="catalog-grid">
          {products?.map((p) => (
            <ProductCard key={p.id} product={p} onClick={() => navigate(`/product/${p.id}`)} />
          ))}
        </div>
      )}

      <div style={{ height: 16 }} />
    </div>
  );
}

function ProductCard({ product, onClick }: { product: Product; onClick: () => void }) {
  const totalStock = Object.values(product.stockBySize || {}).reduce((a, b) => a + b, 0);
  const isLast = totalStock > 0 && totalStock <= 3;

  return (
    <div className="product-card" onClick={onClick}>
      <div style={{ position: 'relative' }}>
        <img
          src={product.images[0] || 'https://placehold.co/300x300/f4f4f5/999?text=Фото'}
          alt={product.name}
          className="product-card__image"
          loading="lazy"
        />
        <div className="product-card__badges" style={{ position: 'absolute', top: 6, left: 6, margin: 0 }}>
          {product.isNew && <span className="badge badge--new">NEW</span>}
          {product.isHot && !product.isNew && <span className="badge badge--hot">HOT</span>}
          {isLast && <span className="badge badge--last">LAST</span>}
        </div>
      </div>
      <div className="product-card__body">
        <div className="product-card__brand">{product.brand}</div>
        <div className="product-card__name">{product.name}</div>
        <div className="product-card__price">{product.price.toLocaleString('ru')} ₽</div>
      </div>
    </div>
  );
}
