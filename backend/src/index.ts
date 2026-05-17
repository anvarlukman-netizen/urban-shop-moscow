import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
dotenv.config();

import { validateTelegramInitData } from './middleware/validateTgInit';
import productsRouter from './routes/products';
import ordersRouter from './routes/orders';
import favouritesRouter from './routes/favourites';
import { initBot, getBot } from './bot/notifications';
import { setupBotCommands } from './bot/commands';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'https://*.vercel.app',
    'https://web.telegram.org',
  ],
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (_req, res) => res.json({ ok: true }));

// API routes (с валидацией Telegram initData)
app.use('/api/products', validateTelegramInitData, productsRouter);
app.use('/api/orders', validateTelegramInitData, ordersRouter);
app.use('/api/favourites', validateTelegramInitData, favouritesRouter);

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
