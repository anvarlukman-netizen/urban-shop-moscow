import TelegramBot from 'node-telegram-bot-api';
import { ParsedOrder } from '../db/schema';

let bot: TelegramBot | null = null;

export function initBot(token: string): TelegramBot {
  bot = new TelegramBot(token, { polling: false });
  return bot;
}

export function getBot(): TelegramBot | null {
  return bot;
}

export async function notifyManagerNewOrder(order: ParsedOrder): Promise<void> {
  const managerId = process.env.MANAGER_CHAT_ID;
  if (!bot || !managerId) return;

  const itemsText = order.items
    .map((i) => `  • ${i.brand} ${i.productName}, р.${i.size} × ${i.quantity} = ${(i.price * i.quantity).toLocaleString('ru')}₽`)
    .join('\n');

  const deliveryEmoji = order.deliveryType === 'pickup' ? '🏪' : '🚚';
  const paymentEmoji = order.paymentMethod === 'card' ? '💳' : '💵';
  const deliveryText = order.deliveryType === 'pickup' ? 'Самовывоз' : `Доставка: ${order.address}`;
  const paymentText = order.paymentMethod === 'card' ? 'Перевод на карту' : 'Наличные при получении';

  const text = [
    `🛍️ <b>Новый заказ #${order.id}</b>`,
    '',
    `👤 <b>${order.customerName}</b>`,
    `📞 ${order.phone}`,
    order.telegramUsername ? `💬 @${order.telegramUsername}` : `🆔 TG ID: ${order.telegramId}`,
    '',
    '<b>Товары:</b>',
    itemsText,
    '',
    `💰 <b>Итого: ${order.totalAmount.toLocaleString('ru')}₽</b>`,
    `${deliveryEmoji} ${deliveryText}`,
    `${paymentEmoji} ${paymentText}`,
    order.comment ? `\n💬 ${order.comment}` : '',
  ].filter((l) => l !== undefined).join('\n');

  await bot.sendMessage(managerId, text, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [[
        { text: '✅ Подтвердить', callback_data: `confirm_${order.id}` },
        { text: '❌ Отменить', callback_data: `cancel_${order.id}` },
      ]],
    },
  });
}
