import { Telegraf } from 'telegraf';
import { ERROR_MESSAGES } from './bot.interface';

export function setupHandlers(bot: Telegraf) {
    bot.on('text', (ctx) => {
        ctx.reply(ERROR_MESSAGES.INVALID_COMMAND);
    });
}