# Urban Shop Moscow — Telegram Mini App

## Быстрый старт

### 1. Заполни `.env`

```
cd backend
copy .env.example .env
```

Открой `backend/.env` и заполни:
- `BOT_TOKEN` — уже заполнен ✅
- `MANAGER_CHAT_ID` — уже заполнен ✅
- `DATABASE_URL` — получишь после создания БД на Railway (шаг 3)

### 2. Установи зависимости

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 3. Создай базу данных на Railway

1. Открой [railway.app](https://railway.app) → New Project → PostgreSQL
2. Скопируй `DATABASE_URL` из вкладки Connect
3. Вставь в `backend/.env`

### 4. Создай таблицы и загрузи товары

```bash
cd backend
npm run db:push      # создаёт таблицы
npm run db:seed      # загружает 20 тестовых товаров
```

### 5. Запусти локально

```bash
# Терминал 1 — backend
cd backend && npm run dev

# Терминал 2 — frontend
cd frontend && npm run dev
```

Frontend: http://localhost:5173
Backend API: http://localhost:3001

### 6. Тестирование Mini App

Для теста в Telegram нужен публичный URL. Используй ngrok:
```bash
npx ngrok http 5173
```
Полученный URL `https://xxxx.ngrok.io` вставь в @BotFather:
1. Открой @BotFather → /mybots → твой бот → Bot Settings → Menu Button → Configure Mini App
2. Вставь URL

### 7. Деплой на Vercel + Railway

**Frontend (Vercel):**
```bash
cd frontend
npm install -g vercel
vercel --prod
```

**Backend (Railway):**
1. В railway.app создай новый сервис → Deploy from GitHub
2. Добавь переменные из .env в Settings → Variables
3. Railway автоматически задеплоит при пуше

После деплоя обнови `FRONTEND_URL` в backend на URL Vercel.

## Структура проекта

```
tg-app/
├── backend/          Express API + Telegram бот
│   ├── src/
│   │   ├── db/       Drizzle ORM + seed данные
│   │   ├── routes/   products, orders, favourites
│   │   ├── bot/      уведомления + команды менеджера
│   │   └── middleware/  валидация Telegram initData
│   └── .env          ← заполни DATABASE_URL
│
└── frontend/         React Mini App
    └── src/
        ├── pages/    Home, Catalog, Product, Cart, Checkout, Favourites, Profile
        ├── store/    Zustand корзина
        ├── api/      клиент к backend
        └── hooks/    useTelegram

## Команды бота менеджера

После деплоя напиши своему боту:
- `/start` — главное меню
- `/orders` — последние 10 заказов
- `/orders_new` — только новые заказы
- `/stats` — статистика заказов
```
