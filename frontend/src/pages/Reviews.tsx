import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useTelegram } from '../hooks/useTelegram';
import type { Review } from '../types';

const IB = "'Inter', sans-serif";
const BB = "'Bebas Neue', sans-serif";

/* ─────────────────────────────────────────────────────────────────────────────
   Все отзывы в одном массиве (Авито + Telegram)
   type: 'text' — текстовый | 'photo' — с фото из чата
───────────────────────────────────────────────────────────────────────────── */
const ALL_REVIEWS = [
  {
    id: 'r1', type: 'photo' as const,
    name: 'Покупательница', initials: 'П', color: '#DB2777',
    date: '19 августа', source: 'Telegram',
    product: 'New Balance 9060 серые',
    text: 'Спасибо большое! получила 😍😍',
    photoUrl: 'https://anvarlukman-netizen.github.io/urban-shop-moscow/uploads/1780525191599-bujugly8ys6.jpg',
  },
  {
    id: 'r2', type: 'text' as const,
    name: 'Виктория', initials: 'В', color: '#7C3AED',
    date: '24 мая', source: 'Авито',
    product: 'Балетки Chanel классические',
    text: 'Купила две пары, ибо дочка забрала первые! Шикарного качества, цвет приглушённо розовый — как в оригинале. Доставка ооочень быстрая, упаковка достойная. Всем рекомендую!!!!',
  },
  {
    id: 'r3', type: 'photo' as const,
    name: 'Покупательница', initials: 'П', color: '#059669',
    date: '3 июня', source: 'Telegram',
    product: 'Nike Air Jordan 1 Low',
    text: 'Кроссовки пришли — это просто любовь с первого взгляда 😍 Спасибо большое ☺️',
    photoUrl: 'https://anvarlukman-netizen.github.io/urban-shop-moscow/uploads/1780525205480-0g8rs6k22ahe.jpg',
  },
  {
    id: 'r4', type: 'text' as const,
    name: 'Мария', initials: 'М', color: '#DB2777',
    date: '19 мая', source: 'Авито',
    product: 'Балетки Chanel плетёные',
    text: 'Продавец внимательный, быстро отвечает на вопросы. Качество великолепное. Спасибо 🤍',
  },
  {
    id: 'r5', type: 'photo' as const,
    name: 'Покупательница', initials: 'П', color: '#D97706',
    date: 'Сентябрь', source: 'Telegram',
    product: 'New Balance 9060 бежевые',
    text: 'Кроссовки просто огонь 🔥 Носить — одно удовольствие!',
    photoUrl: 'https://anvarlukman-netizen.github.io/urban-shop-moscow/uploads/1780525212962-5wq9un6u9x7.jpg',
  },
  {
    id: 'r6', type: 'text' as const,
    name: 'Саид Закриев', initials: 'С', color: '#059669',
    date: '16 мая', source: 'Авито',
    product: 'Кроссовки Premiata мужские',
    text: 'Лучшие кроссовки. Соотношение цены и качества — пушка 🔥',
  },
  {
    id: 'r7', type: 'photo' as const,
    name: 'Покупательница', initials: 'П', color: '#0284C7',
    date: '3 июня', source: 'Telegram',
    product: 'Adidas Samba',
    text: 'Получила заказ и очень довольна 🔥😍 Все подошло идеально, действительно хорошее качество. Спасибо вам! ❤️',
    photoUrl: 'https://anvarlukman-netizen.github.io/urban-shop-moscow/uploads/1780525216459-pqsuut1addj.jpg',
  },
  {
    id: 'r8', type: 'text' as const,
    name: 'Алина', initials: 'А', color: '#DC2626',
    date: '5 мая', source: 'Авито',
    product: 'Балетки Alaia тканевые',
    text: 'Очень довольна покупкой! Продавец быстро среагировал и отправил обувь 🙏 И за возможность примерки отдельное спасибо ❤️',
  },
  {
    id: 'r9', type: 'photo' as const,
    name: 'Покупательница', initials: 'П', color: '#0F766E',
    date: 'Осень', source: 'Telegram',
    product: 'Adidas Campus бежевые',
    text: 'Доброе утро! Спасибо большое за оперативность 🌸',
    photoUrl: 'https://anvarlukman-netizen.github.io/urban-shop-moscow/uploads/1780525224807-ea1yeh16hpm.jpg',
  },
  {
    id: 'r10', type: 'text' as const,
    name: 'Наталья', initials: 'Н', color: '#D97706',
    date: '7 апреля', source: 'Авито',
    product: 'Nike Mind 001',
    text: 'По заказу быстро договорились, оперативно отправили. Товар соответствует описанию. Довольна, рекомендую 👍',
  },
  {
    id: 'r11', type: 'photo' as const,
    name: 'Покупательница', initials: 'П', color: '#7C3AED',
    date: 'Июнь', source: 'Telegram',
    product: 'Nike + Adidas — 2 пары',
    text: 'Так только вашу обувь носить буду 😂👍 Спасибо большое за покупку, носите на радость!',
    photoUrl: 'https://anvarlukman-netizen.github.io/urban-shop-moscow/uploads/1780525255178-tpbnj8tcexl.jpg',
  },
  {
    id: 'r12', type: 'text' as const,
    name: 'Эльвира Калинская', initials: 'Э', color: '#0F766E',
    date: '4 апреля', source: 'Авито',
    product: 'Nike Air Jordan',
    text: 'Все супер! Товар как на фото, подсказали с размером, быстро отправили, быстро пришёл. Большое спасибо 🤍',
  },
  {
    id: 'r13', type: 'photo' as const,
    name: 'Юлия', initials: 'Ю', color: '#DC2626',
    date: '10 октября', source: 'Telegram',
    product: 'Сумка люкс',
    text: 'Юлия! Добрый вечер 😊 Сумки получила 😍 Они просто огонь 🔥 Носите с удовольствием!',
    photoUrl: 'https://anvarlukman-netizen.github.io/urban-shop-moscow/uploads/1780525259726-yf5fv8bbxg.jpg',
  },
  {
    id: 'r14', type: 'text' as const,
    name: 'Anastasia', initials: 'A', color: '#7C3AED',
    date: '2 марта', source: 'Авито',
    product: 'Кеды Alexander McQueen',
    text: 'Отличные кроссовки. В итоге всё сделали как нужно и отправили очень быстро. На счёт размера очень помогли определиться 🙌',
  },
];

/* ── Звёзды ── */
function Stars({ size = 13 }: { size?: number }) {
  return (
    <div style={{ display: 'flex', gap: 1 }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24">
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill="#F4B942" />
        </svg>
      ))}
    </div>
  );
}

/* ── Одна карточка отзыва ── */
function ReviewSlide({ r }: { r: typeof ALL_REVIEWS[number] }) {
  const hasPhoto = r.type === 'photo' && 'photoUrl' in r && r.photoUrl;

  return (
    <div style={{
      flexShrink: 0, width: 272,
      scrollSnapAlign: 'start',
      border: '1.5px solid #EBEBEB',
      background: '#FFF',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Фото или плашка Telegram */}
      {r.type === 'photo' && (
        hasPhoto ? (
          <img
            src={(r as { photoUrl: string }).photoUrl}
            alt={r.product}
            style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{
            width: '100%', aspectRatio: '4/3',
            background: 'linear-gradient(135deg, #0A0A0A 0%, #1a1a2e 100%)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M21.8 5.1L18.4 19.6c-.3 1.2-1 1.5-2 .9L12 17.5l-2.1 2a.7.7 0 0 1-.6.3l.3-3.9L17.5 8c.4-.3 0-.5-.5-.2L5.5 14.3l-3.9-1.2c-.8-.3-.8-.8.2-1.2L20.5 4c.8-.3 1.5.2 1.3 1.1z" fill="rgba(255,255,255,0.3)"/>
            </svg>
            <div style={{ fontFamily: IB, fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', textTransform: 'uppercase' }}>
              Telegram-отзыв
            </div>
          </div>
        )
      )}

      {/* Контент */}
      <div style={{ padding: '14px 14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Аватар + имя */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
            background: r.color, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: IB,
          }}>
            {r.initials}
          </div>
          <div>
            <div style={{ fontFamily: IB, fontSize: 12, fontWeight: 700, color: '#0A0A0A' }}>{r.name}</div>
            <div style={{ fontFamily: IB, fontSize: 10, color: '#AAA', marginTop: 1 }}>{r.date}</div>
          </div>
          {/* Бейдж источника */}
          <div style={{
            marginLeft: 'auto', padding: '2px 7px',
            background: r.source === 'Telegram' ? '#E8F4FD' : '#FFF5E6',
            fontSize: 9, fontFamily: IB, fontWeight: 700,
            color: r.source === 'Telegram' ? '#0088CC' : '#C9963D',
            letterSpacing: '0.5px',
          }}>
            {r.source}
          </div>
        </div>

        {/* Звёзды + продукт */}
        <div>
          <Stars />
          <div style={{ fontFamily: IB, fontSize: 10, fontWeight: 700, color: '#C9963D', textTransform: 'uppercase', letterSpacing: '1px', marginTop: 4 }}>
            {r.product}
          </div>
        </div>

        {/* Текст */}
        <div style={{ fontFamily: IB, fontSize: 12, color: '#444', lineHeight: 1.65, flex: 1 }}>
          {r.text}
        </div>

        {/* Подтверждение */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#888', fontFamily: IB }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth={2.5}>
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Проверенный покупатель
        </div>
      </div>
    </div>
  );
}

/* ── Карусель ── */
function Carousel({ items }: { items: typeof ALL_REVIEWS }) {
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const onScroll = () => {
    const el = ref.current; if (!el) return;
    const cardW = ((el.children[0] as HTMLElement)?.offsetWidth ?? 272) + 12;
    setActive(Math.round(el.scrollLeft / cardW));
  };

  const goTo = (i: number) => {
    const el = ref.current; if (!el) return;
    const card = el.children[i] as HTMLElement;
    el.scrollTo({ left: card.offsetLeft - 16, behavior: 'smooth' });
  };

  return (
    <div>
      <div
        ref={ref} onScroll={onScroll}
        style={{
          display: 'flex', gap: 12, overflowX: 'auto',
          padding: '4px 16px 4px', scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none',
        }}
      >
        {items.map(r => <ReviewSlide key={r.id} r={r} />)}
      </div>

      {/* Точки */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 5, padding: '10px 0 4px' }}>
        {items.map((_, i) => (
          <div key={i} onClick={() => goTo(i)} style={{
            width: i === active ? 20 : 6, height: 6, borderRadius: 3,
            background: i === active ? '#0A0A0A' : '#D5D5D5',
            transition: 'width 0.22s ease', cursor: 'pointer',
          }} />
        ))}
      </div>

      {/* Счётчик */}
      <div style={{ textAlign: 'center', fontFamily: IB, fontSize: 11, color: '#AAA', paddingBottom: 4 }}>
        {active + 1} / {items.length}
      </div>
    </div>
  );
}

/* ── Карточка из БД ── */
function DbReviewCard({ review }: { review: Review }) {
  const date = review.createdAt
    ? new Date(review.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
    : '';
  const colors = ['#7C3AED','#DB2777','#059669','#DC2626','#D97706','#0284C7','#0F766E'];
  const color = colors[review.customerName.charCodeAt(0) % colors.length];
  return (
    <div style={{ padding: '14px 16px', borderBottom: '1px solid #F5F5F5', display: 'flex', gap: 10 }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', background: color, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: IB }}>
        {review.customerName.slice(0,1).toUpperCase()}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <div style={{ fontFamily: IB, fontSize: 13, fontWeight: 700, color: '#0A0A0A' }}>{review.customerName}</div>
          <div style={{ fontFamily: IB, fontSize: 10, color: '#AAA' }}>{date}</div>
        </div>
        <Stars size={12} />
        <div style={{ fontFamily: IB, fontSize: 13, color: '#444', lineHeight: 1.65, marginTop: 6 }}>{review.text}</div>
      </div>
    </div>
  );
}

/* ── Главный экран ── */
export default function Reviews() {
  const navigate = useNavigate();
  const { user } = useTelegram();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState(user ? `${user.first_name}${user.last_name ? ' ' + user.last_name : ''}` : '');
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [err, setErr] = useState('');

  const { data: reviews = [], isLoading } = useQuery({ queryKey: ['reviews'], queryFn: api.getReviews });

  const mutation = useMutation({
    mutationFn: api.createReview,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['reviews'] }); setShowForm(false); setText(''); setRating(5); setErr(''); },
    onError: (e: Error) => setErr(e.message),
  });

  const total = ALL_REVIEWS.length + reviews.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
    <PageHeader title="Отзывы" onBack={() => navigate('/')} />
    <div className="page-scroll" style={{ paddingBottom: 80 }}>

      {/* Шапка */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid #EBEBEB' }}>
        <div style={{ fontFamily: BB, fontSize: 32, letterSpacing: '0.03em', color: '#0A0A0A', marginBottom: 10 }}>ОТЗЫВЫ</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontFamily: BB, fontSize: 52, color: '#0A0A0A', lineHeight: 1 }}>5.0</div>
          <div>
            <Stars size={18} />
            <div style={{ fontFamily: IB, fontSize: 12, color: '#888', marginTop: 4 }}>{total} отзывов · Urban Shop Moscow</div>
            <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
              <div style={{ background: '#F5F5F5', padding: '3px 8px', fontSize: 10, fontFamily: IB, color: '#059669', fontWeight: 700 }}>★★★★★ 100%</div>
              <div style={{ background: '#E8F4FD', padding: '3px 8px', fontSize: 10, fontFamily: IB, color: '#0088CC', fontWeight: 700 }}>Авито · Telegram</div>
            </div>
          </div>
        </div>
      </div>

      {/* Заголовок карусели */}
      <div style={{ padding: '16px 16px 10px' }}>
        <div style={{ fontFamily: BB, fontSize: 20, letterSpacing: '0.04em', color: '#0A0A0A' }}>ЧТО ГОВОРЯТ ПОКУПАТЕЛИ</div>
        <div style={{ fontFamily: IB, fontSize: 11, color: '#AAA', marginTop: 3 }}>Авито и Telegram · все отзывы проверены</div>
      </div>

      {/* Карусель — все отзывы в одном блоке */}
      <Carousel items={ALL_REVIEWS} />

      {/* Кнопка / форма */}
      <div style={{ padding: '16px 16px 0', borderTop: '1px solid #EBEBEB' }}>
        {!showForm ? (
          <button onClick={() => setShowForm(true)} style={{ width: '100%', padding: 14, background: '#0A0A0A', color: '#fff', border: 'none', fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', cursor: 'pointer', fontFamily: IB }}>
            Оставить отзыв
          </button>
        ) : (
          <div style={{ border: '1.5px solid #EBEBEB', padding: 16 }}>
            <div style={{ fontFamily: BB, fontSize: 20, letterSpacing: '0.03em', marginBottom: 14 }}>ВАША ОЦЕНКА</div>

            <div style={{ fontFamily: IB, fontSize: 10, fontWeight: 700, letterSpacing: '1px', color: '#888', textTransform: 'uppercase', marginBottom: 6 }}>Имя</div>
            <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="Ваше имя" style={{ marginBottom: 14 }} />

            <div style={{ fontFamily: IB, fontSize: 10, fontWeight: 700, letterSpacing: '1px', color: '#888', textTransform: 'uppercase', marginBottom: 8 }}>Оценка</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
              {[1,2,3,4,5].map(s => (
                <button key={s} onClick={() => setRating(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 28, color: s <= rating ? '#F4B942' : '#D0D0D0' }}>★</button>
              ))}
            </div>

            <div style={{ fontFamily: IB, fontSize: 10, fontWeight: 700, letterSpacing: '1px', color: '#888', textTransform: 'uppercase', marginBottom: 6 }}>Отзыв</div>
            <textarea className="form-input" value={text} onChange={e => setText(e.target.value)} placeholder="Расскажите о вашем опыте покупки..." rows={3} style={{ marginBottom: 14, resize: 'none' }} />

            {err && <div style={{ color: '#DC2626', fontSize: 13, marginBottom: 10, fontFamily: IB }}>{err}</div>}

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setShowForm(false); setErr(''); }} style={{ flex: 1, padding: 12, background: '#F5F5F5', border: 'none', fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', cursor: 'pointer', fontFamily: IB, color: '#0A0A0A' }}>Отмена</button>
              <button
                onClick={() => {
                  if (name.trim().length < 2) { setErr('Введите имя'); return; }
                  if (text.trim().length < 5) { setErr('Отзыв слишком короткий'); return; }
                  setErr(''); mutation.mutate({ customerName: name.trim(), rating, text: text.trim() });
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

      {/* Отзывы из приложения */}
      {!isLoading && reviews.length > 0 && (
        <div style={{ marginTop: 20, borderTop: '1px solid #EBEBEB' }}>
          <div style={{ fontFamily: BB, fontSize: 18, letterSpacing: '0.04em', color: '#0A0A0A', padding: '14px 16px 4px' }}>НОВЫЕ ОТЗЫВЫ</div>
          {reviews.map(r => <DbReviewCard key={r.id} review={r} />)}
        </div>
      )}

      <div style={{ height: 20 }} />
    </div>
    </div>
  );
}
