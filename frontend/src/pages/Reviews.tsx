import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useTelegram } from '../hooks/useTelegram';
import type { Review } from '../types';

const IB = "'Inter', sans-serif";
const BB = "'Bebas Neue', sans-serif";

/* ── Статичные отзывы с Авито ──────────────────────────────────────────────── */
const STATIC_REVIEWS = [
  {
    id: 's1', name: 'Виктория', initials: 'В', color: '#7C3AED',
    date: '24 мая', rating: 5, source: 'Авито',
    product: 'Балетки Chanel классические',
    text: 'Купила две пары, ибо дочка забрала первые! Шикарного качества, цвет приглушённо розовый — как в оригинале. Доставка ооочень быстрая, упаковка достойная. Всем рекомендую!!!!',
  },
  {
    id: 's2', name: 'Мария', initials: 'М', color: '#DB2777',
    date: '19 мая', rating: 5, source: 'Авито',
    product: 'Балетки Chanel плетёные',
    text: 'Продавец внимательный, быстро отвечает на вопросы. Качество великолепное. Спасибо 🤍',
  },
  {
    id: 's3', name: 'Саид Закриев', initials: 'С', color: '#059669',
    date: '16 мая', rating: 5, source: 'Авито',
    product: 'Кроссовки Premiata мужские',
    text: 'Лучшие кроссовки. Соотношение цены и качества — пушка 🔥',
  },
  {
    id: 's4', name: 'Алина', initials: 'А', color: '#DC2626',
    date: '5 мая', rating: 5, source: 'Авито',
    product: 'Балетки Alaia тканевые',
    text: 'Очень довольна покупкой! Продавец быстро среагировал и отправил обувь 🙏 И за возможность примерки отдельное спасибо ❤️',
  },
  {
    id: 's5', name: 'Наталья', initials: 'Н', color: '#D97706',
    date: '7 апреля', rating: 5, source: 'Авито',
    product: 'Nike Mind 001',
    text: 'По заказу быстро договорились, оперативно отправили. Товар соответствует описанию. Довольна, рекомендую 👍',
  },
  {
    id: 's6', name: 'Эльвира Калинская', initials: 'Э', color: '#0284C7',
    date: '4 апреля', rating: 5, source: 'Авито',
    product: 'Nike Air Jordan 1',
    text: 'Все супер! Товар как на фото, подсказали с размером, быстро отправили, быстро пришёл. Большое спасибо 🤍',
  },
  {
    id: 's7', name: 'Anastasia', initials: 'A', color: '#0F766E',
    date: '2 марта', rating: 5, source: 'Авито',
    product: 'Кеды Alexander McQueen',
    text: 'Отличные кроссовки. Сначала было недопонимание, но всё сделали как нужно и отправили очень быстро. На счёт размера очень помогли определиться 🙌',
  },
];


/* ── Звёзды ────────────────────────────────────────────────────────────────── */
function Stars({ count = 5, size = 14 }: { count?: number; size?: number }) {
  return (
    <div style={{ display: 'flex', gap: 1 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24">
          <polygon
            points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
            fill={i < count ? '#F4B942' : '#E0E0E0'}
          />
        </svg>
      ))}
    </div>
  );
}

/* ── Карусель статичных отзывов ────────────────────────────────────────────── */
function StaticCarousel() {
  const [active, setActive] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollTo = (idx: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.children[idx] as HTMLElement;
    el.scrollTo({ left: card.offsetLeft - 16, behavior: 'smooth' });
    setActive(idx);
  };

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const cardW = (el.children[0] as HTMLElement)?.offsetWidth + 12;
    setActive(Math.round(el.scrollLeft / cardW));
  };

  return (
    <div>
      {/* Карточки */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        style={{
          display: 'flex', gap: 12, overflowX: 'auto',
          padding: '4px 16px 12px', scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' as never,
        }}
      >
        {STATIC_REVIEWS.map((r) => (
          <div
            key={r.id}
            style={{
              flexShrink: 0, width: 270,
              scrollSnapAlign: 'start',
              background: '#FFFFFF',
              border: '1.5px solid #EBEBEB',
              padding: '16px 16px 18px',
              display: 'flex', flexDirection: 'column', gap: 10,
            }}
          >
            {/* Шапка */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 38, height: 38, borderRadius: '50%',
                background: r.color, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontFamily: IB,
                fontSize: 15, fontWeight: 700, color: '#fff', flexShrink: 0,
              }}>
                {r.initials}
              </div>
              <div>
                <div style={{ fontFamily: IB, fontSize: 13, fontWeight: 700, color: '#0A0A0A' }}>{r.name}</div>
                <div style={{ fontFamily: IB, fontSize: 11, color: '#AAA', marginTop: 1 }}>{r.date} · {r.source}</div>
              </div>
            </div>

            {/* Звёзды + продукт */}
            <div>
              <Stars />
              <div style={{ fontFamily: IB, fontSize: 10, fontWeight: 700, color: '#C9963D', textTransform: 'uppercase', letterSpacing: '1px', marginTop: 5 }}>
                {r.product}
              </div>
            </div>

            {/* Текст */}
            <div style={{ fontFamily: IB, fontSize: 13, color: '#444', lineHeight: 1.65 }}>
              {r.text}
            </div>

            {/* Сделка состоялась */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#888', fontFamily: IB }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth={2.5}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Сделка состоялась
            </div>
          </div>
        ))}
      </div>

      {/* Точки */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginBottom: 4 }}>
        {STATIC_REVIEWS.map((_, i) => (
          <div
            key={i}
            onClick={() => scrollTo(i)}
            style={{
              width: i === active ? 18 : 6, height: 6, borderRadius: 3,
              background: i === active ? '#0A0A0A' : '#D0D0D0',
              transition: 'width 0.22s ease', cursor: 'pointer',
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Карточка отзыва из БД ─────────────────────────────────────────────────── */
function ReviewCard({ review }: { review: Review }) {
  const date = review.createdAt
    ? new Date(review.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
    : '';
  const initials = review.customerName.slice(0, 1).toUpperCase();
  const colors = ['#7C3AED','#DB2777','#059669','#DC2626','#D97706','#0284C7','#0F766E'];
  const color = colors[review.customerName.charCodeAt(0) % colors.length];

  return (
    <div style={{ padding: '16px 16px 18px', borderBottom: '1px solid #F0F0F0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{
          width: 38, height: 38, borderRadius: '50%', background: color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: IB, fontSize: 15, fontWeight: 700, color: '#fff', flexShrink: 0,
        }}>
          {initials}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: IB, fontSize: 13, fontWeight: 700, color: '#0A0A0A' }}>{review.customerName}</div>
          <div style={{ fontFamily: IB, fontSize: 11, color: '#AAA', marginTop: 1 }}>{date}</div>
        </div>
        <Stars count={review.rating} size={12} />
      </div>
      <div style={{ fontFamily: IB, fontSize: 13, color: '#444', lineHeight: 1.65 }}>{review.text}</div>
    </div>
  );
}

/* ── Главный компонент ─────────────────────────────────────────────────────── */
export default function Reviews() {
  const { user } = useTelegram();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState(user ? `${user.first_name}${user.last_name ? ' ' + user.last_name : ''}` : '');
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [submitError, setSubmitError] = useState('');

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['reviews'],
    queryFn: api.getReviews,
  });

  const mutation = useMutation({
    mutationFn: api.createReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      setShowForm(false); setText(''); setRating(5); setSubmitError('');
    },
    onError: (err: Error) => setSubmitError(err.message),
  });

  const totalReviews = STATIC_REVIEWS.length + reviews.length;

  return (
    <div className="page-scroll" style={{ paddingBottom: 80 }}>

      {/* ── Шапка ── */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid #EBEBEB' }}>
        <div style={{ fontFamily: BB, fontSize: 32, letterSpacing: '0.03em', color: '#0A0A0A', marginBottom: 10 }}>
          ОТЗЫВЫ
        </div>
        {/* Итоговый рейтинг */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ fontFamily: BB, fontSize: 52, color: '#0A0A0A', lineHeight: 1 }}>5.0</div>
          <div>
            <Stars size={18} />
            <div style={{ fontFamily: IB, fontSize: 12, color: '#888', marginTop: 4 }}>
              {totalReviews} отзывов · Urban Shop Moscow
            </div>
            <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
              {['★★★★★ 98%'].map(t => (
                <div key={t} style={{ background: '#F5F5F5', padding: '3px 8px', fontSize: 10, fontFamily: IB, color: '#444', fontWeight: 600 }}>
                  {t}
                </div>
              ))}
              <div style={{ background: '#F5F5F5', padding: '3px 8px', fontSize: 10, fontFamily: IB, color: '#C9963D', fontWeight: 600 }}>
                Авито · Telegram
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Карусель отзывов ── */}
      <div style={{ paddingTop: 16, borderBottom: '1px solid #EBEBEB' }}>
        <div style={{ fontFamily: BB, fontSize: 18, letterSpacing: '0.04em', color: '#0A0A0A', padding: '0 16px 12px' }}>
          ЧТО ГОВОРЯТ ПОКУПАТЕЛИ
        </div>
        <StaticCarousel />
      </div>

      {/* ── Кнопка оставить отзыв ── */}
      <div style={{ padding: '16px 16px 0' }}>
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            style={{
              width: '100%', padding: 14, background: '#0A0A0A', color: '#fff',
              border: 'none', fontSize: 11, fontWeight: 700, letterSpacing: '2px',
              textTransform: 'uppercase', cursor: 'pointer', fontFamily: IB,
            }}
          >
            Оставить отзыв
          </button>
        ) : (
          <div style={{ border: '1.5px solid #EBEBEB', padding: 16, marginBottom: 4 }}>
            <div style={{ fontFamily: BB, fontSize: 20, letterSpacing: '0.03em', marginBottom: 14 }}>ВАША ОЦЕНКА</div>

            <div style={{ fontFamily: IB, fontSize: 10, fontWeight: 700, letterSpacing: '1px', color: '#888', textTransform: 'uppercase', marginBottom: 6 }}>Имя</div>
            <input
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ваше имя"
              style={{ marginBottom: 14 }}
            />

            <div style={{ fontFamily: IB, fontSize: 10, fontWeight: 700, letterSpacing: '1px', color: '#888', textTransform: 'uppercase', marginBottom: 8 }}>Оценка</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
              {[1,2,3,4,5].map(s => (
                <button
                  key={s}
                  onClick={() => setRating(s)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 28 }}
                >
                  {s <= rating ? '★' : '☆'}
                </button>
              ))}
            </div>

            <div style={{ fontFamily: IB, fontSize: 10, fontWeight: 700, letterSpacing: '1px', color: '#888', textTransform: 'uppercase', marginBottom: 6 }}>Отзыв</div>
            <textarea
              className="form-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Расскажите о вашем опыте покупки..."
              rows={3}
              style={{ marginBottom: 14, resize: 'none' }}
            />

            {submitError && <div style={{ color: '#DC2626', fontSize: 13, marginBottom: 10, fontFamily: IB }}>{submitError}</div>}

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { setShowForm(false); setSubmitError(''); }}
                style={{ flex: 1, padding: 12, background: '#F5F5F5', border: 'none', fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', cursor: 'pointer', fontFamily: IB, color: '#0A0A0A' }}
              >
                Отмена
              </button>
              <button
                onClick={() => {
                  if (!name.trim() || name.trim().length < 2) { setSubmitError('Введите имя'); return; }
                  if (!text.trim() || text.trim().length < 5) { setSubmitError('Отзыв слишком короткий'); return; }
                  setSubmitError('');
                  mutation.mutate({ customerName: name.trim(), rating, text: text.trim() });
                }}
                disabled={mutation.isPending}
                style={{ flex: 2, padding: 12, background: '#0A0A0A', border: 'none', color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', cursor: 'pointer', fontFamily: IB }}
              >
                {mutation.isPending ? 'Отправка...' : 'Отправить'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Отзывы из приложения ── */}
      {!isLoading && reviews.length > 0 && (
        <div style={{ marginTop: 20, borderTop: '1px solid #EBEBEB' }}>
          <div style={{ fontFamily: BB, fontSize: 18, letterSpacing: '0.04em', color: '#0A0A0A', padding: '16px 16px 4px' }}>
            ОТЗЫВЫ В ПРИЛОЖЕНИИ
          </div>
          {reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
        </div>
      )}

      <div style={{ height: 20 }} />
    </div>
  );
}
