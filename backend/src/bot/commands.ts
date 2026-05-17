import TelegramBot from 'node-telegram-bot-api';
import { db } from '../db';
import { orders } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

export function setupBotCommands(bot: TelegramBot): void {
  const managerId = process.env.MANAGER_CHAT_ID!;
  const isManager = (chatId: number) => String(chatId) === managerId;

  bot.onText(/\/start/, (msg: TelegramBot.Message) => {
    if (!isManager(msg.chat.id)) return;
    bot.sendMessage(msg.chat.id, [
      '👋 <b>Urban Shop Moscow — панель менеджера</b>',
      '',
      '/orders — последние 10 заказов',
      '/orders_new — только новые',
      '/stats — статистика',
    ].join('\n'), { parse_mode: 'HTML' });
  });

  bot.onText(/\/orders$/, async (msg: TelegramBot.Message) => {
    if (!isManager(msg.chat.id)) return;
    const rows = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(10);

    if (!rows.length) return void bot.sendMessage(msg.chat.id, '📭 Заказов нет');

    const emoji: Record<string, string> = {
      new: '🆕', confirmed: '✅', shipped: '📦', delivered: '🎉', cancelled: '❌',
    };

    const text = rows.map((o) => {
      const date = new Date(o.createdAt!).toLocaleDateString('ru-RU');
      return `${emoji[o.status ?? 'new'] ?? '❓'} #${o.id} ${o.customerName} — ${o.totalAmount.toLocaleString('ru')}₽ (${date})`;
    }).join('\n');

    bot.sendMessage(msg.chat.id, `📋 <b>Последние заказы:</b>\n\n${text}`, { parse_mode: 'HTML' });
  });

  bot.onText(/\/orders_new/, async (msg: TelegramBot.Message) => {
    if (!isManager(msg.chat.id)) return;
    const rows = await db.select().from(orders).where(eq(orders.status, 'new')).orderBy(desc(orders.createdAt));
    if (!rows.length) return void bot.sendMessage(msg.chat.id, '✅ Новых заказов нет');
    bot.sendMessage(msg.chat.id, `🆕 <b>Новых заказов: ${rows.length}</b>`, { parse_mode: 'HTML' });
  });

  bot.onText(/\/stats/, async (msg: TelegramBot.Message) => {
    if (!isManager(msg.chat.id)) return;
    const all = await db.select().from(orders);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayRows = all.filter((o) => new Date(o.createdAt!) >= today);

    bot.sendMessage(msg.chat.id, [
      '📊 <b>Статистика</b>',
      '',
      `Сегодня: ${todayRows.length} заказов — ${todayRows.reduce((s, o) => s + o.totalAmount, 0).toLocaleString('ru')}₽`,
      `Всего: ${all.length} заказов — ${all.reduce((s, o) => s + o.totalAmount, 0).toLocaleString('ru')}₽`,
    ].join('\n'), { parse_mode: 'HTML' });
  });

  bot.on('callback_query', async (query: TelegramBot.CallbackQuery) => {
    if (!query.data || !query.message) return;
    const [action, orderId] = query.data.split('_');
    if (!orderId) return;

    const newStatus = action === 'confirm' ? 'confirmed' : 'cancelled';
    await db.update(orders).set({ status: newStatus }).where(eq(orders.id, Number(orderId)));

    const emoji = action === 'confirm' ? '✅' : '❌';
    await bot.answerCallbackQuery(query.id, { text: `${emoji} Статус обновлён` });
    const prevText = query.message.text ?? '';
    await bot.editMessageText(`${prevText}\n\n${emoji} <b>${action === 'confirm' ? 'Подтверждён' : 'Отменён'} менеджером</b>`, {
      chat_id: query.message.chat.id,
      message_id: query.message.message_id,
      parse_mode: 'HTML',
    });
  });
}
