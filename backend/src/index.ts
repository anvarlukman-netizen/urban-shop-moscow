import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
dotenv.config();

import { validateTelegramInitData } from './middleware/validateTgInit';
import { adminAuth } from './middleware/adminAuth';
import productsRouter from './routes/products';
import ordersRouter from './routes/orders';
import favouritesRouter from './routes/favourites';
import reviewsRouter from './routes/reviews';
import adminRouter from './routes/admin';
import { initBot, getBot } from './bot/notifications';
import { setupBotCommands } from './bot/commands';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Health check
app.get('/health', (_req, res) => res.json({ ok: true }));

// API routes (с валидацией Telegram initData)
app.use('/api/products', validateTelegramInitData, productsRouter);
app.use('/api/orders', validateTelegramInitData, ordersRouter);
app.use('/api/favourites', validateTelegramInitData, favouritesRouter);
app.use('/api/reviews', validateTelegramInitData, reviewsRouter);

// Admin routes (защита паролем)
app.use('/api/admin', adminAuth, adminRouter);

// Инициализируем Telegram бота
const botToken = process.env.BOT_TOKEN;
if (botToken && botToken !== 'ВСТАВЬ_ТОКЕН_СЮДА') {
  const bot = initBot(botToken);
  bot.startPolling();
  setupBotCommands(bot);
  console.log('✅ Telegram bot started');
} else {
  console.warn('⚠️  BOT_TOKEN not set — bot disabled');
}

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
