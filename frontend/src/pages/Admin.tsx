import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Product } from '../types';

const API = import.meta.env.VITE_API_URL || '/api';

// ── API helpers ──────────────────────────────────────────────────────────────
function adminRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const password = localStorage.getItem('admin_password') || '';
  return fetch(`${API}/admin${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-admin-password': password,
      ...options?.headers,
    },
  }).then(async (res) => {
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Ошибка сети' }));
      throw new Error(err.error || 'Ошибка запроса');
    }
    return res.json();
  });
}

async function uploadImage(file: File): Promise<string> {
  const password = localStorage.getItem('admin_password') || '';
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API}/admin/upload`, {
    method: 'POST',
    headers: { 'x-admin-password': password },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || 'Upload failed');
  }

  const data = await res.json() as { url: string };
  return data.url;
}

// ── Types ─────────────────────────────────────────────────────────────────────
const BRANDS = ['Nike', 'Jordan', 'New Balance', 'Adidas', 'Puma', 'On Cloud', 'Golden Goose', 'Premiata', 'Lacoste'];
const CATEGORIES = ['sneakers', 'clothing', 'bags', 'Сланцы'];
const GENDERS = [{ v: 'male', l: 'Мужское' }, { v: 'female', l: 'Женское' }, { v: 'unisex', l: 'Унисекс' }];
const ALL_SIZES = ['35', '35.5', '36', '36.5', '37', '37.5', '38', '38.5', '39', '39.5', '40', '40.5', '41', '41.5', '42', '42.5', '43', '43.5', '44', '44.5', '45', '45.5', '46'];

type FormData = {
  name: string; brand: string; category: string; gender: string;
  price: string; description: string; article: string;
  colorway: string; material: string;
  images: string[]; sizes: string[];
  stockBySize: Record<string, string>;
  isNew: boolean; isHot: boolean; inStock: boolean;
};

const emptyForm = (): FormData => ({
  name: '', brand: 'Nike', category: 'sneakers', gender: 'unisex',
  price: '', description: '', article: '', colorway: '', material: '',
  images: [], sizes: [], stockBySize: {},
  isNew: false, isHot: false, inStock: true,
});

// ── Login screen ──────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr('');
    localStorage.setItem('admin_password', pw);
    try {
      await adminRequest('/products');
      onLogin();
    } catch {
      setErr('Неверный пароль');
      localStorage.removeItem('admin_password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F5F5' }}>
      <div style={{ background: '#fff', padding: 40, width: 360, boxShadow: '0 2px 16px rgba(0,0,0,0.08)' }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, letterSpacing: 2, marginBottom: 8 }}>URBAN SHOP</div>
        <div style={{ fontSize: 13, color: '#888', marginBottom: 32 }}>Панель управления</div>
        <form onSubmit={handle}>
          <input
            type="password"
            placeholder="Пароль администратора"
            value={pw}
            onChange={e => setPw(e.target.value)}
            style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #E0E0E0', fontSize: 14, marginBottom: 12, boxSizing: 'border-box', outline: 'none' }}
          />
          {err && <div style={{ color: '#E53E3E', fontSize: 13, marginBottom: 12 }}>{err}</div>}
          <button
            type="submit"
            disabled={loading || !pw}
            style={{ width: '100%', padding: '12px', background: '#0A0A0A', color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading || !pw ? 0.6 : 1 }}
          >
            {loading ? 'Проверка...' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Image uploader ─────────────────────────────────────────────────────────────
function ImageUploader({ images, onChange }: { images: string[]; onChange: (imgs: string[]) => void }) {
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList) => {
    setUploading(true);
    const newUrls: string[] = [];
    for (const file of Array.from(files)) {
      try {
        const url = await uploadImage(file);
        newUrls.push(url);
      } catch (e) {
        alert('Ошибка загрузки: ' + (e as Error).message);
      }
    }
    onChange([...images, ...newUrls]);
    setUploading(false);
  }, [images, onChange]);

  const addUrl = () => {
    const trimmed = urlInput.trim();
    if (trimmed && !images.includes(trimmed)) {
      onChange([...images, trimmed]);
      setUrlInput('');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
        {images.map((url, i) => (
          <div key={i} style={{ position: 'relative', width: 80, height: 80 }}>
            <img src={url} alt="" style={{ width: 80, height: 80, objectFit: 'cover', border: '1.5px solid #E0E0E0' }} />
            {i === 0 && <div style={{ position: 'absolute', top: 2, left: 2, background: '#C9963D', color: '#fff', fontSize: 9, padding: '1px 4px', fontWeight: 700 }}>ГЛАВНОЕ</div>}
            <button
              onClick={() => onChange(images.filter((_, j) => j !== i))}
              style={{ position: 'absolute', top: 2, right: 2, background: '#E53E3E', color: '#fff', border: 'none', width: 18, height: 18, fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >✕</button>
          </div>
        ))}
        <div
          onClick={() => fileRef.current?.click()}
          style={{ width: 80, height: 80, border: '2px dashed #E0E0E0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: uploading ? 'not-allowed' : 'pointer', color: '#888', fontSize: 11, gap: 4 }}
        >
          {uploading ? '⏳' : '+'}<span>{uploading ? 'Загрузка...' : 'Загрузить'}</span>
        </div>
      </div>
      <input ref={fileRef} type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files && handleFiles(e.target.files)} />
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <input
          placeholder="Или вставь URL фото..."
          value={urlInput}
          onChange={e => setUrlInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addUrl())}
          style={{ flex: 1, padding: '8px 10px', border: '1.5px solid #E0E0E0', fontSize: 12, outline: 'none' }}
        />
        <button onClick={addUrl} style={{ padding: '8px 14px', background: '#0A0A0A', color: '#fff', border: 'none', fontSize: 12, cursor: 'pointer' }}>Добавить</button>
      </div>
    </div>
  );
}

// ── Sizes & stock editor ───────────────────────────────────────────────────────
function SizesEditor({ sizes, stockBySize, onChange }: {
  sizes: string[];
  stockBySize: Record<string, string>;
  onChange: (sizes: string[], stock: Record<string, string>) => void;
}) {
  const toggleSize = (s: string) => {
    if (sizes.includes(s)) {
      const newSizes = sizes.filter(x => x !== s);
      const newStock = { ...stockBySize };
      delete newStock[s];
      onChange(newSizes, newStock);
    } else {
      onChange([...sizes, s], { ...stockBySize, [s]: '5' });
    }
  };

  const setStock = (s: string, v: string) => {
    onChange(sizes, { ...stockBySize, [s]: v });
  };

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {ALL_SIZES.map(s => (
          <button
            key={s}
            type="button"
            onClick={() => toggleSize(s)}
            style={{
              padding: '5px 10px', border: '1.5px solid', fontSize: 12,
              background: sizes.includes(s) ? '#0A0A0A' : '#fff',
              color: sizes.includes(s) ? '#fff' : '#333',
              borderColor: sizes.includes(s) ? '#0A0A0A' : '#E0E0E0',
              cursor: 'pointer',
            }}
          >{s}</button>
        ))}
      </div>
      {sizes.length > 0 && (
        <div>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>Остаток по размерам:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {sizes.map(s => (
              <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <span style={{ fontSize: 11, color: '#555' }}>{s}</span>
                <input
                  type="number"
                  min="0"
                  value={stockBySize[s] ?? '5'}
                  onChange={e => setStock(s, e.target.value)}
                  style={{ width: 46, padding: '4px 6px', border: '1.5px solid #E0E0E0', fontSize: 12, textAlign: 'center', outline: 'none' }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Product form modal ─────────────────────────────────────────────────────────
function ProductModal({ product, onClose, onSave }: {
  product: Product | null;
  onClose: () => void;
  onSave: (data: object) => void;
}) {
  const [form, setForm] = useState<FormData>(() => {
    if (product) {
      return {
        name: product.name,
        brand: product.brand,
        category: product.category,
        gender: product.gender,
        price: String(product.price),
        description: product.description || '',
        article: product.article || '',
        colorway: product.colorway || '',
        material: product.material || '',
        images: product.images || [],
        sizes: (product.sizes || []).map(String),
        stockBySize: Object.fromEntries(Object.entries(product.stockBySize || {}).map(([k, v]) => [k, String(v)])),
        isNew: product.isNew || false,
        isHot: product.isHot || false,
        inStock: product.inStock !== false,
      };
    }
    return emptyForm();
  });

  const set = (key: keyof FormData, val: unknown) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...form,
      price: Number(form.price),
      sizes: form.sizes.map(s => isNaN(Number(s)) ? s : Number(s)),
      stockBySize: Object.fromEntries(Object.entries(form.stockBySize).map(([k, v]) => [k, Number(v)])),
    });
  };

  const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', border: '1.5px solid #E0E0E0', fontSize: 13, boxSizing: 'border-box', outline: 'none', fontFamily: 'Inter,sans-serif' };
  const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#555', marginBottom: 4, display: 'block' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '20px 0' }}>
      <div style={{ background: '#fff', width: '100%', maxWidth: 640, margin: '0 16px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1.5px solid #E0E0E0' }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, letterSpacing: 1 }}>
            {product ? 'Редактировать товар' : 'Новый товар'}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#888' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 20 }}>
          {/* Фотографии */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Фотографии</label>
            <ImageUploader images={form.images} onChange={v => set('images', v)} />
          </div>

          {/* Основная информация */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Название *</label>
              <input required value={form.name} onChange={e => set('name', e.target.value)} style={inputStyle} placeholder="Nike Air Max 90" />
            </div>
            <div>
              <label style={labelStyle}>Цена (₽) *</label>
              <input required type="number" value={form.price} onChange={e => set('price', e.target.value)} style={inputStyle} placeholder="12900" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Бренд *</label>
              <select value={form.brand} onChange={e => set('brand', e.target.value)} style={{ ...inputStyle, background: '#fff' }}>
                {BRANDS.map(b => <option key={b}>{b}</option>)}
                <option value="Other">Другой</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Категория *</label>
              <select value={form.category} onChange={e => set('category', e.target.value)} style={{ ...inputStyle, background: '#fff' }}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Пол *</label>
              <select value={form.gender} onChange={e => set('gender', e.target.value)} style={{ ...inputStyle, background: '#fff' }}>
                {GENDERS.map(g => <option key={g.v} value={g.v}>{g.l}</option>)}
              </select>
            </div>
          </div>

          {/* Детали */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Артикул</label>
              <input value={form.article} onChange={e => set('article', e.target.value)} style={inputStyle} placeholder="FV6026-104" />
            </div>
            <div>
              <label style={labelStyle}>Расцветка</label>
              <input value={form.colorway} onChange={e => set('colorway', e.target.value)} style={inputStyle} placeholder="Sail/Orange" />
            </div>
            <div>
              <label style={labelStyle}>Материал</label>
              <input value={form.material} onChange={e => set('material', e.target.value)} style={inputStyle} placeholder="Кожа, резина" />
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Описание</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} style={{ ...inputStyle, height: 80, resize: 'vertical' }} placeholder="Описание товара..." />
          </div>

          {/* Размеры */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Размеры и остатки</label>
            <SizesEditor
              sizes={form.sizes}
              stockBySize={form.stockBySize}
              onChange={(s, st) => setForm(f => ({ ...f, sizes: s, stockBySize: st }))}
            />
          </div>

          {/* Флаги */}
          <div style={{ display: 'flex', gap: 24, marginBottom: 20 }}>
            {([['isNew', '🆕 Новинка'], ['isHot', '🔥 Хит'], ['inStock', '✅ В наличии']] as [keyof FormData, string][]).map(([key, label]) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                <input type="checkbox" checked={form[key] as boolean} onChange={e => set(key, e.target.checked)} style={{ width: 16, height: 16 }} />
                {label}
              </label>
            ))}
          </div>

          {/* Кнопки */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button type="submit" style={{ flex: 1, padding: '12px', background: '#0A0A0A', color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer' }}>
              {product ? '💾 Сохранить' : '➕ Создать товар'}
            </button>
            <button type="button" onClick={onClose} style={{ padding: '12px 20px', background: '#fff', color: '#333', border: '1.5px solid #E0E0E0', fontSize: 12, cursor: 'pointer' }}>
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Order status config ────────────────────────────────────────────────────────
const ORDER_STATUSES = [
  { key: 'new',       label: 'Новый',       color: '#888',   bg: '#F5F5F5' },
  { key: 'confirmed', label: 'Подтверждён', color: '#166534', bg: '#DCFCE7' },
  { key: 'packed',    label: 'Упакован',    color: '#854D0E', bg: '#FEF9C3' },
  { key: 'shipped',   label: 'Отправлен',   color: '#1E40AF', bg: '#DBEAFE' },
  { key: 'delivered', label: 'Доставлен',   color: '#166534', bg: '#DCFCE7' },
  { key: 'cancelled', label: 'Отменён',     color: '#991B1B', bg: '#FEE2E2' },
];

interface OrderItem { productId: number; productName: string; brand: string; size: string | number; quantity: number; price: number; image: string; }
interface Order { id: number; telegramId: string; telegramUsername: string | null; customerName: string; phone: string; deliveryType: string; address: string | null; paymentMethod: string; items: OrderItem[]; totalAmount: number; status: string | null; comment: string | null; createdAt: string | null; }

function StatusBadge({ status }: { status: string | null }) {
  const s = ORDER_STATUSES.find(x => x.key === (status ?? 'new')) ?? ORDER_STATUSES[0];
  return <span style={{ background: s.bg, color: s.color, padding: '3px 10px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>{s.label}</span>;
}

// ── Orders CRM ─────────────────────────────────────────────────────────────────
function OrdersCRM() {
  const qc = useQueryClient();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: orderList = [], isLoading } = useQuery<Order[]>({
    queryKey: ['admin-orders'],
    queryFn: () => adminRequest('/orders'),
    refetchInterval: 30_000,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      adminRequest(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-orders'] }),
  });

  const filtered = statusFilter === 'all'
    ? orderList
    : orderList.filter(o => o.status === statusFilter);

  const counts = ORDER_STATUSES.reduce((acc, s) => {
    acc[s.key] = orderList.filter(o => o.status === s.key).length;
    return acc;
  }, {} as Record<string, number>);

  if (isLoading) return <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Загрузка заказов...</div>;

  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <button
          onClick={() => setStatusFilter('all')}
          style={{ padding: '8px 16px', border: '1.5px solid', borderColor: statusFilter === 'all' ? '#0A0A0A' : '#E0E0E0', background: statusFilter === 'all' ? '#0A0A0A' : '#fff', color: statusFilter === 'all' ? '#fff' : '#555', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
        >
          Все ({orderList.length})
        </button>
        {ORDER_STATUSES.map(s => (
          <button key={s.key}
            onClick={() => setStatusFilter(s.key)}
            style={{ padding: '8px 16px', border: '1.5px solid', borderColor: statusFilter === s.key ? s.color : '#E0E0E0', background: statusFilter === s.key ? s.bg : '#fff', color: statusFilter === s.key ? s.color : '#555', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
          >
            {s.label} {counts[s.key] ? `(${counts[s.key]})` : ''}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Заказов нет</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(order => {
            const isExpanded = expandedId === order.id;
            const date = order.createdAt ? new Date(order.createdAt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';
            return (
              <div key={order.id} style={{ background: '#fff', border: '1.5px solid #E0E0E0' }}>
                {/* Шапка заказа */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer' }}
                >
                  <div style={{ fontWeight: 700, fontSize: 14, minWidth: 70 }}>#{order.id}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{order.customerName}</div>
                    <div style={{ fontSize: 11, color: '#888' }}>{order.phone} {order.telegramUsername ? `· @${order.telegramUsername}` : ''}</div>
                  </div>
                  <div style={{ textAlign: 'right', marginRight: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{order.totalAmount.toLocaleString('ru')} ₽</div>
                    <div style={{ fontSize: 11, color: '#AAA' }}>{date}</div>
                  </div>
                  <StatusBadge status={order.status} />
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth={2} style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: '0.2s', flexShrink: 0 }}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>

                {/* Детали */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid #F0F0F0', padding: '12px 16px' }}>
                    {/* Товары */}
                    <div style={{ marginBottom: 12 }}>
                      {order.items.map((item, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                          {item.image && <img src={item.image} alt="" style={{ width: 44, height: 44, objectFit: 'contain', background: '#F7F7F7', border: '1px solid #E0E0E0' }} />}
                          <div style={{ flex: 1, fontSize: 12 }}>
                            <div style={{ fontWeight: 600 }}>{item.brand} {item.productName}</div>
                            <div style={{ color: '#888' }}>р.{item.size} × {item.quantity}</div>
                          </div>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{(item.price * item.quantity).toLocaleString('ru')} ₽</div>
                        </div>
                      ))}
                    </div>

                    {/* Детали доставки */}
                    <div style={{ fontSize: 12, color: '#555', marginBottom: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      <span style={{ background: '#F5F5F5', padding: '3px 8px' }}>
                        {order.deliveryType === 'pickup' ? '🏪 Самовывоз' : `🚚 ${order.address}`}
                      </span>
                      <span style={{ background: '#F5F5F5', padding: '3px 8px' }}>
                        {order.paymentMethod === 'card' ? '💳 Карта' : '💵 Наличные'}
                      </span>
                      {order.comment && <span style={{ background: '#F5F5F5', padding: '3px 8px' }}>💬 {order.comment}</span>}
                    </div>

                    {/* Смена статуса */}
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Изменить статус:</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {ORDER_STATUSES.map(s => (
                          <button key={s.key}
                            disabled={order.status === s.key || statusMutation.isPending}
                            onClick={() => statusMutation.mutate({ id: order.id, status: s.key })}
                            style={{
                              padding: '7px 14px', border: '1.5px solid',
                              borderColor: order.status === s.key ? s.color : '#E0E0E0',
                              background: order.status === s.key ? s.bg : '#fff',
                              color: order.status === s.key ? s.color : '#555',
                              fontSize: 12, fontWeight: 600, cursor: order.status === s.key ? 'default' : 'pointer',
                              opacity: order.status === s.key ? 1 : 0.8,
                            }}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main Admin page ────────────────────────────────────────────────────────────
export default function Admin() {
  const [authed, setAuthed] = useState(() => !!localStorage.getItem('admin_password'));
  const [editProduct, setEditProduct] = useState<Product | null | 'new'>(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('orders');
  const qc = useQueryClient();

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['admin-products'],
    queryFn: () => adminRequest('/products'),
    enabled: authed,
  });

  const createMutation = useMutation({
    mutationFn: (data: object) => adminRequest('/products', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-products'] }); setEditProduct(null); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: object }) => adminRequest(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-products'] }); setEditProduct(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminRequest(`/products/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-products'] }),
  });

  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />;

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.brand.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F5', fontFamily: 'Inter,sans-serif' }}>
      {/* Top bar */}
      <div style={{ background: '#0A0A0A', color: '#fff', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 24, letterSpacing: 2 }}>URBAN SHOP — ADMIN</div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            onClick={() => { localStorage.removeItem('admin_password'); setAuthed(false); }}
            style={{ background: 'none', border: '1px solid #444', color: '#aaa', padding: '6px 14px', fontSize: 11, cursor: 'pointer', letterSpacing: 1 }}
          >ВЫЙТИ</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: '#fff', borderBottom: '1.5px solid #E0E0E0', display: 'flex', padding: '0 24px' }}>
        {[
          { key: 'orders', label: '📦 Заказы (CRM)' },
          { key: 'products', label: '👟 Товары' },
        ].map(tab => (
          <button key={tab.key}
            onClick={() => setActiveTab(tab.key as 'orders' | 'products')}
            style={{
              padding: '14px 20px', border: 'none', background: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 700, letterSpacing: 0.5,
              color: activeTab === tab.key ? '#0A0A0A' : '#888',
              borderBottom: activeTab === tab.key ? '2.5px solid #0A0A0A' : '2.5px solid transparent',
              marginBottom: -1.5,
            }}
          >{tab.label}</button>
        ))}
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        {/* ── ЗАКАЗЫ ── */}
        {activeTab === 'orders' && <OrdersCRM />}

        {/* ── ТОВАРЫ ── */}
        {activeTab === 'products' && <>
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <input
            placeholder="Поиск по названию или бренду..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, padding: '10px 14px', border: '1.5px solid #E0E0E0', fontSize: 13, background: '#fff', outline: 'none' }}
          />
          <button
            onClick={() => setEditProduct('new')}
            style={{ padding: '10px 20px', background: '#0A0A0A', color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >+ Добавить товар</button>
        </div>

        {/* Products table */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Загрузка...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Товары не найдены</div>
        ) : (
          <div style={{ background: '#fff', border: '1.5px solid #E0E0E0' }}>
            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 100px 80px 70px 80px 130px', gap: 12, padding: '10px 16px', borderBottom: '1.5px solid #E0E0E0', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#888' }}>
              <div>Фото</div><div>Название</div><div>Бренд</div><div>Цена</div><div>Наличие</div><div>Статус</div><div>Действия</div>
            </div>
            {filtered.map(p => (
              <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 100px 80px 70px 80px 130px', gap: 12, padding: '10px 16px', borderBottom: '1px solid #F0F0F0', alignItems: 'center', fontSize: 13 }}>
                <img
                  src={p.images[0] || 'https://placehold.co/60x60/f4f4f5/999?text=?'}
                  alt=""
                  style={{ width: 52, height: 52, objectFit: 'cover', border: '1px solid #E0E0E0' }}
                />
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 2 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: '#888' }}>{p.category} · {p.gender}</div>
                </div>
                <div style={{ color: '#555' }}>{p.brand}</div>
                <div style={{ fontWeight: 700 }}>{p.price.toLocaleString('ru')} ₽</div>
                <div>
                  {p.inStock
                    ? <span style={{ background: '#DCFCE7', color: '#166534', padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>В наличии</span>
                    : <span style={{ background: '#FEE2E2', color: '#991B1B', padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>Нет</span>
                  }
                </div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {p.isNew && <span style={{ background: '#C9963D', color: '#fff', padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>NEW</span>}
                  {p.isHot && <span style={{ background: '#E53E3E', color: '#fff', padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>HOT</span>}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => setEditProduct(p)}
                    style={{ flex: 1, padding: '6px', background: '#fff', border: '1.5px solid #0A0A0A', color: '#0A0A0A', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                  >✏️ Изм.</button>
                  <button
                    onClick={() => { if (confirm(`Удалить "${p.name}"?`)) deleteMutation.mutate(p.id); }}
                    style={{ flex: 1, padding: '6px', background: '#FEE2E2', border: '1.5px solid #E53E3E', color: '#E53E3E', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                  >🗑️ Удал.</button>
                </div>
              </div>
            ))}
          </div>
        )}
        </>}
      </div>

      {/* Modal */}
      {editProduct !== null && (
        <ProductModal
          product={editProduct === 'new' ? null : editProduct}
          onClose={() => setEditProduct(null)}
          onSave={(data) => {
            if (editProduct === 'new') {
              createMutation.mutate(data);
            } else {
              updateMutation.mutate({ id: (editProduct as Product).id, data });
            }
          }}
        />
      )}
    </div>
  );
}
