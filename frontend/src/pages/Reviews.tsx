import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useTelegram } from '../hooks/useTelegram';
import type { Review } from '../types';

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => onChange?.(star)}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: onChange ? 'pointer' : 'default',
            fontSize: 22,
            color: star <= value ? 'var(--brand-accent)' : '#D1D5DB',
            lineHeight: 1,
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const date = review.createdAt
    ? new Date(review.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  return (
    <div className="card" style={{ padding: '16px 18px', marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--tg-theme-text-color, #111)' }}>
            {review.customerName}
          </div>
          {review.telegramUsername && (
            <div style={{ fontSize: 12, color: 'var(--tg-theme-hint-color, #9CA3AF)', marginTop: 1 }}>
              @{review.telegramUsername}
            </div>
          )}
        </div>
        <div style={{ fontSize: 12, color: 'var(--tg-theme-hint-color, #9CA3AF)', flexShrink: 0, marginLeft: 8 }}>
          {date}
        </div>
      </div>
      <StarRating value={review.rating} />
      <p style={{ marginTop: 10, fontSize: 14, lineHeight: 1.55, color: 'var(--tg-theme-text-color, #111)' }}>
        {review.text}
      </p>
    </div>
  );
}

function AverageBadge({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) return null;
  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: 'var(--brand-accent-lt, #F5ECD7)',
      border: '1px solid var(--brand-border, #E6E2D8)',
      borderRadius: 14, padding: '14px 18px', marginBottom: 20,
    }}>
      <span style={{ fontSize: 36, fontFamily: 'var(--font-display)', color: 'var(--brand-accent)', fontWeight: 700 }}>
        {avg.toFixed(1)}
      </span>
      <div>
        <StarRating value={Math.round(avg)} />
        <div style={{ fontSize: 13, color: 'var(--tg-theme-hint-color, #9CA3AF)', marginTop: 4 }}>
          {reviews.length} {reviews.length === 1 ? 'отзыв' : reviews.length < 5 ? 'отзыва' : 'отзывов'}
        </div>
      </div>
    </div>
  );
}

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
      setShowForm(false);
      setText('');
      setRating(5);
      setSubmitError('');
    },
    onError: (err: Error) => {
      setSubmitError(err.message);
    },
  });

  const handleSubmit = () => {
    if (!name.trim() || name.trim().length < 2) {
      setSubmitError('Введите имя (минимум 2 символа)');
      return;
    }
    if (!text.trim() || text.trim().length < 5) {
      setSubmitError('Отзыв слишком короткий (минимум 5 символов)');
      return;
    }
    setSubmitError('');
    mutation.mutate({ customerName: name.trim(), rating, text: text.trim() });
  };

  return (
    <div style={{ padding: '16px 16px 24px' }}>
      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 28,
        fontWeight: 600,
        margin: '0 0 4px',
        color: 'var(--brand-accent)',
      }}>
        Отзывы
      </h1>
      <p style={{ fontSize: 13, color: 'var(--tg-theme-hint-color, #9CA3AF)', marginBottom: 20 }}>
        Urban Shop Moscow
      </p>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 110, borderRadius: 14 }} />
          ))}
        </div>
      ) : (
        <>
          <AverageBadge reviews={reviews} />

          {!showForm && (
            <button
              className="btn-primary"
              style={{ width: '100%', marginBottom: 20 }}
              onClick={() => setShowForm(true)}
            >
              Оставить отзыв
            </button>
          )}

          {showForm && (
            <div className="card" style={{ padding: '18px 18px', marginBottom: 20 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 600 }}>Ваш отзыв</h3>

              <label style={{ display: 'block', fontSize: 13, color: 'var(--tg-theme-hint-color, #9CA3AF)', marginBottom: 4 }}>
                Ваше имя
              </label>
              <input
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Имя"
                style={{ marginBottom: 14 }}
              />

              <label style={{ display: 'block', fontSize: 13, color: 'var(--tg-theme-hint-color, #9CA3AF)', marginBottom: 6 }}>
                Оценка
              </label>
              <div style={{ marginBottom: 14 }}>
                <StarRating value={rating} onChange={setRating} />
              </div>

              <label style={{ display: 'block', fontSize: 13, color: 'var(--tg-theme-hint-color, #9CA3AF)', marginBottom: 4 }}>
                Текст отзыва
              </label>
              <textarea
                className="form-input"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Расскажите о вашем опыте покупки..."
                rows={4}
                style={{ marginBottom: 14, resize: 'none' }}
              />

              {submitError && (
                <div style={{ color: '#DC2626', fontSize: 13, marginBottom: 12 }}>{submitError}</div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  className="btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => { setShowForm(false); setSubmitError(''); }}
                >
                  Отмена
                </button>
                <button
                  className="btn-primary"
                  style={{ flex: 2 }}
                  onClick={handleSubmit}
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? 'Отправляем...' : 'Отправить'}
                </button>
              </div>
            </div>
          )}

          {reviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--tg-theme-hint-color, #9CA3AF)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
              <div style={{ fontSize: 15 }}>Отзывов пока нет</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>Будьте первым!</div>
            </div>
          ) : (
            reviews.map((r) => <ReviewCard key={r.id} review={r} />)
          )}
        </>
      )}
    </div>
  );
}
