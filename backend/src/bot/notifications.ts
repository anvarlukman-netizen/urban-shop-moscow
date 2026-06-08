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

const STATUS_MESSAGES: Record<string, string> = {
  confirmed: '✅ Ваш заказ <b>#{{id}}</b> подтверждён!\n\nМы приступаем к сборке. Скоро упакуем и отправим.',
  packed:    '📦 Заказ <b>#{{id}}</b> упакован!\n\nОстаётся только передать курьеру.',
  shipped:   '🚀 Заказ <b>#{{id}}</b> отправлен!\n\nКурьер уже в пути — скоро будет у вас.',
  delivered: '🎉 Заказ <b>#{{id}}</b> доставлен!\n\nСпасибо за покупку в Urban Shop Moscow. Носите с удовольствием! ❤️',
  cancelled: '❌ Заказ <b>#{{id}}</b> отменён.\n\nЕсли есть вопросы — напишите нам.',
};

export async function notifyCustomerStatusUpdate(order: ParsedOrder, status: string): Promise<void> {
  if (!bot) return;
  const telegramId = order.telegramId;
  if (!telegramId || telegramId === '0') return;

  const template = STATUS_MESSAGES[status];
  if (!template) return;

  const text = template.replace('{{id}}', String(order.id));
  await bot.sendMessage(telegramId, text, { parse_mode: 'HTML' });
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
